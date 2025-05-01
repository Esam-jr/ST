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
      
      // Format date for SQL query
      const formattedDate = now.toISOString();
      
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
        WHERE "startDate" >= ${formattedDate}::timestamp
        ORDER BY "startDate" ASC
      `;

      return res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch events',
        details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined 
      });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 