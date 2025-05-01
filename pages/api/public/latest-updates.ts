import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

// Define types for our data
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  type: string;
  imageUrl?: string | null;
  createdAt: Date;
}

interface Advertisement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
}

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
      let events: Event[] = [];
      try {
        events = await prisma.event.findMany({
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
      } catch (eventError) {
        console.error('Error fetching events:', eventError);
        // Continue with empty events array
      }
      
      // Get active announcements (limited to 5)
      let announcements: Advertisement[] = [];
      try {
        announcements = await prisma.advertisement.findMany({
          where: {
            status: 'ACTIVE', // Using the status field instead of isActive
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            title: true,
            content: true, // Using content instead of description
            imageUrl: true,
            createdAt: true,
          },
        });
      } catch (announcementError) {
        console.error('Error fetching announcements:', announcementError);
        // Continue with empty announcements array
      }

      // Format events for the combined response
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: event.imageUrl,
        date: event.startDate,
        type: 'event' as const,
        category: event.type,
        createdAt: event.createdAt
      }));
      
      // Format announcements for the combined response
      const formattedAnnouncements = announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        description: announcement.content, // Map content to description
        imageUrl: announcement.imageUrl,
        type: 'announcement' as const,
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
      // Return a more informative error message in development
      if (process.env.NODE_ENV !== 'production') {
        return res.status(500).json({ 
          error: 'Failed to fetch latest updates', 
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      return res.status(500).json({ error: 'Failed to fetch latest updates' });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 