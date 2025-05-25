import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { parse as json2csv } from 'json2csv';
import { Prisma } from '@prisma/client';

interface PrismaError extends Error {
  code?: string;
}

// Helper function to handle Prisma connection errors
async function withPrisma<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: unknown) {
    const error = e as PrismaError;
    // If there's a connection error, try to reconnect
    if (error.code === 'P2021' || error.code === '26000') {
      await prisma.$connect();
      return await fn();
    }
    throw error;
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

    // Fetch all relevant data with connection handling
    const [users, startups, reviews, sponsorships] = await Promise.all([
      // User activity
      withPrisma(() => prisma.user.findMany({
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
      withPrisma(() => prisma.startup.findMany({
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
      withPrisma(() => prisma.review.findMany({
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
      withPrisma(() => prisma.sponsorshipApplication.findMany({
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
        
        const csv = json2csv({ data: csvData });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
        return res.send(csv);
      }

      default:
        return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error: unknown) {
    console.error('Error generating report:', error);
    await prisma.$disconnect();
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
} 