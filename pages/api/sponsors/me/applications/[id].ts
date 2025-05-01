import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
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

  // Only sponsors can access their own applications
  if (session.user.role !== 'SPONSOR') {
    return res.status(403).json({ error: 'Forbidden: Only sponsors can access this endpoint' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid opportunity ID' });
  }

  try {
    // Find the application for this opportunity submitted by the current sponsor
    const application = await prisma.sponsorshipApplication.findFirst({
      where: {
        opportunityId: id,
        sponsorId: session.user.id,
      },
      include: {
        opportunity: {
          select: {
            title: true,
            description: true,
            minAmount: true,
            maxAmount: true,
            currency: true,
            benefits: true,
            status: true,
            deadline: true,
            startupCallId: true,
            startupCall: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ error: 'Failed to fetch application' });
  }
} 