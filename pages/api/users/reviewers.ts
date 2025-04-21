import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import withPrisma from '@/lib/prisma-wrapper';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized. Only admins can access reviewer data.' });
    }

    // Fetch all reviewers
    const reviewers = await withPrisma(() => 
      prisma.user.findMany({
        where: { 
          role: Role.REVIEWER 
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          applicationReviews: {
            select: {
              id: true,
              status: true,
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    );

    // Transform the data to include review statistics
    const formattedReviewers = reviewers.map(reviewer => {
      // Calculate review counts
      const totalReviews = reviewer.applicationReviews.length;
      const completedReviews = reviewer.applicationReviews.filter(
        r => r.status === 'COMPLETED'
      ).length;
      const pendingReviews = totalReviews - completedReviews;

      // Remove applicationReviews from the response
      const { applicationReviews, ...rest } = reviewer;

      return {
        ...rest,
        status: 'active', // Default status (could be stored in DB in the future)
        joinedDate: reviewer.createdAt,
        assignedReviews: totalReviews,
        completedReviews,
        pendingReviews,
      };
    });

    return res.status(200).json(formattedReviewers);
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 