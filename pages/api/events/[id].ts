import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      message: 'Invalid event ID.',
    });
  }

  // GET - Retrieve a specific event
  if (req.method === 'GET') {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return res.status(404).json({
          message: 'Event not found.',
        });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({
        message: 'An error occurred while fetching the event.',
      });
    }
  }

  // For non-GET requests, require authentication
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({
      message: 'You must be signed in to access this endpoint.',
    });
  }

  // Check if user has admin or manager role for write operations
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return res.status(403).json({
      message: 'You do not have permission to modify events.',
    });
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
        type,
        isVirtual,
        virtualLink,
        startupCallId
      } = req.body;

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          title,
          description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          location,
          type,
          isVirtual,
          virtualLink,
          startupCallId: startupCallId || null
        },
      });

      return res.status(200).json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // P2025: Record not found
        if (error.code === 'P2025') {
          return res.status(404).json({
            message: 'Event not found.',
          });
        }
      }

      return res.status(500).json({
        message: 'An error occurred while updating the event.',
      });
    }
  }

  // DELETE - Delete an event
  if (req.method === 'DELETE') {
    try {
      await prisma.event.delete({
        where: { id },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting event:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // P2025: Record not found
        if (error.code === 'P2025') {
          return res.status(404).json({
            message: 'Event not found.',
          });
        }
      }

      return res.status(500).json({
        message: 'An error occurred while deleting the event.',
      });
    }
  }

  // Return 405 for unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
} 