import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all advertisements (public endpoint)
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { status, startupCallId } = req.query;
      
      // Build filter conditions
      const filter: any = {};
      
      // Filter by status
      if (status) {
        filter.status = status;
      }
      
      // Filter by startupCallId
      if (startupCallId) {
        filter.startupCallId = startupCallId as string;
      }
      
      // Fetch advertisements based on filters
      const advertisements = await prisma.advertisement.findMany({
        where: filter,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return res.status(200).json(advertisements);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return res.status(500).json({
        message: 'An error occurred while fetching advertisements.',
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
  
  // Check if user has admin role for write operations
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SPONSOR') {
    return res.status(403).json({
      message: 'You do not have permission to modify advertisements.',
    });
  }
  
  // POST - Create advertisement
  if (req.method === 'POST') {
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
      
      // Validate required fields
      if (!title || !content || !status) {
        return res.status(400).json({
          message: 'Missing required fields: title, content, and status are required.',
        });
      }
      
      // Create advertisement
      const advertisement = await prisma.advertisement.create({
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
      
      return res.status(201).json(advertisement);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        return res.status(400).json({
          message: `Error: ${error.message}`,
        });
      }
      
      return res.status(500).json({
        message: 'An error occurred while creating the advertisement.',
      });
    }
  }
  
  // Return 405 for unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
} 