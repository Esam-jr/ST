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
      message: 'Invalid advertisement ID.',
    });
  }

  // GET - Retrieve a specific advertisement (public endpoint)
  if (req.method === 'GET') {
    try {
      const advertisement = await prisma.advertisement.findUnique({
        where: { id },
      });

      if (!advertisement) {
        return res.status(404).json({
          message: 'Advertisement not found.',
        });
      }

      return res.status(200).json(advertisement);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      return res.status(500).json({
        message: 'An error occurred while fetching the advertisement.',
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

  // Check if user has admin or sponsor role for write operations
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SPONSOR') {
    return res.status(403).json({
      message: 'You do not have permission to modify advertisements.',
    });
  }

  // PUT - Update an advertisement
  if (req.method === 'PUT') {
    try {
      const {
        title,
        description,
        content,
        mediaUrl,
        platforms,
        startupCallId,
        status,
        publishedDate,
        expiryDate,
      } = req.body;

      const updatedAdvertisement = await prisma.advertisement.update({
        where: { id },
        data: {
          title,
          description,
          content,
          mediaUrl,
          platforms: Array.isArray(platforms) ? platforms : [],
          startupCallId,
          status,
          publishedDate: publishedDate ? new Date(publishedDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      });

      return res.status(200).json(updatedAdvertisement);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // P2025: Record not found
        if (error.code === 'P2025') {
          return res.status(404).json({
            message: 'Advertisement not found.',
          });
        }
      }

      return res.status(500).json({
        message: 'An error occurred while updating the advertisement.',
      });
    }
  }

  // DELETE - Delete an advertisement
  if (req.method === 'DELETE') {
    try {
      await prisma.advertisement.delete({
        where: { id },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // P2025: Record not found
        if (error.code === 'P2025') {
          return res.status(404).json({
            message: 'Advertisement not found.',
          });
        }
      }

      return res.status(500).json({
        message: 'An error occurred while deleting the advertisement.',
      });
    }
  }

  // Return 405 for unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
} 