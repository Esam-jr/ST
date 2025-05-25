import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parse as json2csv } from 'json2csv';

interface PrismaError extends Error {
  code?: string;
  clientVersion?: string;
}

// Create a new Prisma client instance for each request
const getPrismaClient = () => {
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  });
  return prisma;
};

// Helper function to handle Prisma operations with proper connection management
async function withPrismaClient<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = getPrismaClient();
  try {
    await prisma.$connect();
    const result = await operation(prisma);
    return result;
  } catch (e: unknown) {
    const error = e as PrismaError;
    console.error('Prisma operation error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Type for report data items
interface ReportDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeframe = '30' } = req.body;
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all relevant data with proper connection handling
    const [users, startups, reviews, sponsorships] = await Promise.all([
      // User activity
      withPrismaClient((prisma) => prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })),

      // Startup activity
      withPrismaClient((prisma) => prisma.startup.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          name: true,
          status: true,
          stage: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })),

      // Review activity
      withPrismaClient((prisma) => prisma.review.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          score: true,
          createdAt: true,
          startup: { select: { name: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })),

      // Sponsorship activity
      withPrismaClient((prisma) => prisma.sponsorshipApplication.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          proposedAmount: true,
          createdAt: true,
          sponsorType: true,
          organizationName: true,
          sponsor: {
            select: {
              name: true
            }
          },
          opportunity: {
            select: {
              title: true,
              startupCall: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      })),
    ]);

    // Calculate summary statistics
    const summary = {
      totalNewUsers: users.length,
      totalNewStartups: startups.length,
      totalNewReviews: reviews.length,
      totalNewSponsorships: sponsorships.length,
      averageReviewScore: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length 
        : 0,
      totalSponsorshipAmount: sponsorships
        .filter(s => s.status === 'APPROVED')
        .reduce((sum, s) => sum + (s.proposedAmount || 0), 0),
    };

    // Format the data
    const reportData = {
      summary,
      users: users.map(u => ({
        id: u.id,
        name: u.name || 'N/A',
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString()
      })),
      startups: startups.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        stage: s.stage,
        createdAt: s.createdAt.toISOString()
      })),
      reviews: reviews.map(r => ({
        id: r.id,
        status: r.status,
        score: r.score,
        createdAt: r.createdAt.toISOString(),
        startup: r.startup?.name || 'N/A',
        reviewer: r.reviewer?.name || 'N/A'
      })),
      sponsorships: sponsorships.map(s => ({
        id: s.id,
        status: s.status,
        amount: s.proposedAmount,
        createdAt: s.createdAt.toISOString(),
        sponsor: s.sponsor?.name || 'N/A',
        sponsorType: s.sponsorType,
        organization: s.organizationName || s.sponsor?.name || 'N/A',
        opportunity: s.opportunity?.title || 'N/A',
        program: s.opportunity?.startupCall?.title || 'N/A'
      }))
    };

    // Generate report in requested format
    const { format = 'json' } = req.body;
    const fileName = `platform-activity-report-${new Date().toISOString().split('T')[0]}`;

    try {
      switch (format) {
        case 'json':
          return res.status(200).json(reportData);

        case 'excel': {
          const workbook = new ExcelJS.Workbook();
          
          // Summary Sheet
          const summarySheet = workbook.addWorksheet('Summary');
          summarySheet.addRow(['Platform Activity Summary']);
          summarySheet.addRow(['Period', `Last ${timeframe} days`]);
          summarySheet.addRow([]);
          Object.entries(summary).forEach(([key, value]) => {
            summarySheet.addRow([key, typeof value === 'number' ? value.toFixed(2) : value]);
          });

          // Activity Sheets
          const sheets = {
            'Users': reportData.users,
            'Startups': reportData.startups,
            'Reviews': reportData.reviews,
            'Sponsorships': reportData.sponsorships
          };

          Object.entries(sheets).forEach(([name, data]) => {
            if (!Array.isArray(data) || data.length === 0) return;
            
            const sheet = workbook.addWorksheet(name);
            const headers = Object.keys(data[0]);
            sheet.addRow(headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)));
            
            data.forEach((item: ReportDataItem) => {
              sheet.addRow(headers.map(header => {
                const value = item[header];
                return value === null || value === undefined ? 'N/A' : value;
              }));
            });
          });

          const buffer = await workbook.xlsx.writeBuffer();
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);
          return res.send(buffer);
        }

        case 'csv': {
          try {
            const csvData = [
              ...Object.entries(summary).map(([key, value]) => ({ 
                type: 'Summary', 
                metric: key, 
                value: typeof value === 'number' ? value.toFixed(2) : value 
              })),
              ...reportData.users.map(u => ({ type: 'User', ...u })),
              ...reportData.startups.map(s => ({ type: 'Startup', ...s })),
              ...reportData.reviews.map(r => ({ type: 'Review', ...r })),
              ...reportData.sponsorships.map(s => ({ type: 'Sponsorship', ...s })),
            ];
            
            const csv = json2csv({ 
              data: csvData,
              fields: ['type', 'metric', 'value', 'id', 'name', 'email', 'role', 'status', 'stage', 'score', 'amount', 'sponsor', 'organization', 'opportunity', 'program', 'createdAt']
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
            return res.send(csv);
          } catch (csvError) {
            console.error('CSV generation error:', csvError);
            return res.status(500).json({ 
              error: 'Failed to generate CSV',
              details: csvError instanceof Error ? csvError.message : 'Unknown error during CSV generation'
            });
          }
        }

        default:
          return res.status(400).json({ error: 'Invalid format' });
      }
    } catch (formatError) {
      console.error('Format generation error:', formatError);
      return res.status(500).json({ 
        error: 'Failed to generate report in requested format',
        details: formatError instanceof Error ? formatError.message : 'Unknown error during format generation'
      });
    }
  } catch (error: unknown) {
    console.error('Error generating report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 