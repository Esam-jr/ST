import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get current date at the start of the day
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Find all public events that are either happening today or in the future
      const events = await prisma.event.findMany({
        where: {
          startDate: {
            gte: now,
          },
        },
        orderBy: {
          startDate: 'asc',  // Show soonest events first
        },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          isVirtual: true,
          virtualLink: true,
          imageUrl: true,
          type: true,
          createdAt: true,
          // Exclude sensitive or admin-only fields
        },
      });

      return res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 