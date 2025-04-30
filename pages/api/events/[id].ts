import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  // GET - Get a single event by ID
  if (req.method === 'GET') {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          StartupCall: {
            select: {
              id: true,
              title: true,
            },
          },
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

  // Only admins can update or delete events
  if (session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // PUT - Update an event
  if (req.method === 'PUT') {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        isVirtual,
        virtualLink,
        imageUrl,
        type,
        startupCallId,
      } = req.body;

      if (!title || !description || !startDate || !endDate || !location || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const event = await prisma.event.update({
        where: { id },
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          isVirtual: isVirtual || false,
          virtualLink,
          imageUrl,
          type,
          startupCallId,
        },
      });

      return res.status(200).json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({ error: 'Failed to update event' });
    }
  }

  // DELETE - Delete an event
  if (req.method === 'DELETE') {
    try {
      await prisma.event.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 