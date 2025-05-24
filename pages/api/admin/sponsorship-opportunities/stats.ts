import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Get total opportunities
    const totalOpportunities = await prisma.sponsorshipOpportunity.count();

    // Get active opportunities (status = 'OPEN')
    const activeOpportunities = await prisma.sponsorshipOpportunity.count({
      where: {
        status: 'OPEN',
      },
    });

    // Get total applications
    const totalApplications = await prisma.sponsorshipApplication.count();

    // Get total amount from all applications
    const applications = await prisma.sponsorshipApplication.findMany({
      select: {
        amount: true,
      },
    });

    const totalAmount = applications.reduce((sum, app) => sum + app.amount, 0);

    // Get recent activity
    const recentActivity = await prisma.sponsorshipApplication.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        opportunity: {
          select: {
            title: true,
          },
        },
        sponsor: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get status distribution
    const statusDistribution = await prisma.sponsorshipOpportunity.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get monthly trends
    const monthlyTrends = await prisma.sponsorshipApplication.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
      take: 12,
    });

    return res.status(200).json({
      totalOpportunities,
      activeOpportunities,
      totalApplications,
      totalAmount,
      recentActivity,
      statusDistribution,
      monthlyTrends,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 