import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get announcements sorted by created date (most recent first)
      const announcements = await prisma.advertisement.findMany({
        where: {
          // Add any filtering criteria here if needed
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          linkUrl: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          // Exclude admin-only fields
        },
      });

      return res.status(200).json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 