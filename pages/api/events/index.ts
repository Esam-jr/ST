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
      // Add caching headers
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60');
      
      // Limit fields to only what's needed to improve performance
      const events = await prisma.event.findMany({
        orderBy: {
          startDate: 'desc',
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
          startupCallId: true,
          StartupCall: {
            select: {
              id: true,
              title: true,
            },
          },
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
          endDate: new Date(endDate || startDate), // Default to startDate if endDate not provided
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