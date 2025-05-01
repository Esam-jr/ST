import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid opportunity ID' });
  }

  try {
    // Check if the opportunity exists
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Sponsorship opportunity not found' });
    }

    // Only admins can see all applications for an opportunity
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can view all applications' });
    }

    // Get applications for the opportunity
    const applications = await prisma.sponsorshipApplication.findMany({
      where: {
        opportunityId: id,
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching sponsorship applications:', error);
    return res.status(500).json({ error: 'Failed to fetch sponsorship applications' });
  }
} 