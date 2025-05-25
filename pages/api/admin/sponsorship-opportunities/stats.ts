import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get total opportunities count
    const totalOpportunities = await prisma.sponsorshipOpportunity.count();

    // Get active opportunities count (status = OPEN)
    const activeOpportunities = await prisma.sponsorshipOpportunity.count({
      where: {
        status: 'OPEN',
      },
    });

    // Get total applications count
    const totalApplications = await prisma.sponsorshipApplication.count();

    // Get pending applications count
    const pendingApplications = await prisma.sponsorshipApplication.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get total amount from approved applications
    const approvedApplications = await prisma.sponsorshipApplication.aggregate({
      where: {
        status: 'APPROVED',
      },
      _sum: {
        proposedAmount: true,
      },
    });

    return res.status(200).json({
      totalOpportunities,
      activeOpportunities,
      totalApplications,
      pendingApplications,
      totalAmount: approvedApplications._sum.proposedAmount || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
} 