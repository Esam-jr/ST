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
      
      // Get recent and upcoming events (limited to 5)
      const events = await prisma.event.findMany({
        where: {
          startDate: {
            gte: now,
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          type: true,
          imageUrl: true,
          createdAt: true,
        },
      });
      
      // Get active announcements (limited to 5)
      const announcements = await prisma.advertisement.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          createdAt: true,
        },
      });

      // Format events for the combined response
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: event.imageUrl,
        date: event.startDate,
        type: 'event',
        category: event.type,
        createdAt: event.createdAt
      }));
      
      // Format announcements for the combined response
      const formattedAnnouncements = announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        imageUrl: announcement.imageUrl,
        type: 'announcement',
        category: 'ANNOUNCEMENT',
        createdAt: announcement.createdAt
      }));
      
      // Combine and sort by creation date (most recent first)
      const latestUpdates = [...formattedEvents, ...formattedAnnouncements]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6); // Limit to 6 total items

      return res.status(200).json(latestUpdates);
    } catch (error) {
      console.error('Error fetching latest updates:', error);
      return res.status(500).json({ error: 'Failed to fetch latest updates' });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 