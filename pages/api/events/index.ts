import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Fetch all events
  if (req.method === 'GET') {
    try {
      const events = await prisma.event.findMany({
        orderBy: {
          startDate: 'desc',
        },
      });

      return res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: 'Failed to fetch events' });
    }
  }

  // POST - Create a new event
  if (req.method === 'POST') {
    try {
      const { title, description, startDate, endDate, location, isVirtual, virtualLink, imageUrl, type } = req.body;

      if (!title || !description || !startDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          location,
          isVirtual: Boolean(isVirtual),
          virtualLink,
          imageUrl,
          type,
        },
      });

      return res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({ message: 'Failed to create event' });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
} 