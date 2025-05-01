import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }
  
  if (req.method === 'GET') {
    try {
      // Use raw query to avoid prepared statement issues
      const events = await prisma.$queryRaw`
        SELECT 
          id, 
          title, 
          description, 
          "startDate", 
          "endDate", 
          location, 
          "isVirtual", 
          "virtualLink", 
          "imageUrl", 
          type, 
          "createdAt"
        FROM "Event"
        WHERE id = ${id}
        LIMIT 1
      `;
      
      // Check if we got a result
      const event = Array.isArray(events) && events.length > 0 ? events[0] : null;
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      return res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch event',
        details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined
      });
    }
  }
  
  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 