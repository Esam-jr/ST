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
      const event = await prisma.event.findUnique({
        where: { id },
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
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      return res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
  }
  
  // Only allow GET requests
  return res.status(405).json({ error: 'Method not allowed' });
} 