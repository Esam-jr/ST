import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET request - public event listing doesn't require authentication
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { from, to } = req.query;
      
      // Build filter conditions
      const filter: any = {};
      
      // Date filtering
      if (from || to) {
        filter.startDate = {};
        
        if (from) {
          filter.startDate.gte = new Date(from as string);
        }
        
        if (to) {
          filter.startDate.lte = new Date(to as string);
        }
      }
      
      // Fetch events based on filters
      const events = await prisma.event.findMany({
        where: filter,
        orderBy: {
          startDate: 'asc',
        },
      });
      
      return res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({
        message: 'An error occurred while fetching events.',
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
  
  // Handle POST request - create event
  if (req.method === 'POST') {
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
      
      // Validate required fields
      if (!title || !startDate || !endDate || !type) {
        return res.status(400).json({
          message: 'Missing required fields: title, startDate, endDate, and type are required.',
        });
      }
      
      // Create event
      const event = await prisma.event.create({
        data: {
          title,
          description: description || "",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          type,
          isVirtual: isVirtual || false,
          virtualLink,
          startupCallId
        },
      });
      
      return res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      
      if (error instanceof PrismaClientKnownRequestError) {
        // Handle any specific Prisma errors
        return res.status(400).json({
          message: `Error: ${error.message}`,
        });
      }
      
      return res.status(500).json({
        message: 'An error occurred while creating the event.',
      });
    }
  }
  
  // Return 405 for unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
} 