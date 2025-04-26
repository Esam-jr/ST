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
  // Add performance monitoring
  const startTime = Date.now();

  // Handle GET request - public event listing doesn't require authentication
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { from, to, page, pageSize, limit } = req.query;
      
      // Parse pagination parameters with defaults
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedPageSize = pageSize ? parseInt(pageSize as string) : 10;
      
      // Validate pagination parameters
      const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const validPageSize = isNaN(parsedPageSize) || parsedPageSize <= 0 ? 10 : Math.min(parsedPageSize, 50);
      
      // Calculate skip for pagination
      const skip = (validPage - 1) * validPageSize;
      
      // Build filter conditions
      const filter: any = {};
      
      // Date filtering - with fallback to ensure we always have events
      if (from || to) {
        filter.startDate = {};
        
        if (from && typeof from === 'string' && from.trim() !== '') {
          try {
            const fromDate = new Date(from);
            // Verify it's a valid date
            if (!isNaN(fromDate.getTime())) {
              filter.startDate.gte = fromDate;
            }
          } catch (e) {
            console.warn('Invalid from date parameter', from);
          }
        }
        
        if (to && typeof to === 'string' && to.trim() !== '') {
          try {
            const toDate = new Date(to);
            // Verify it's a valid date
            if (!isNaN(toDate.getTime())) {
              filter.startDate.lte = toDate;
            }
          } catch (e) {
            console.warn('Invalid to date parameter', to);
          }
        }
      }
      
      // Default to show upcoming events if no valid date filters
      if (!filter.startDate?.gte && !filter.startDate?.lte) {
        filter.startDate = { gte: new Date() };
      }
      
      // Apply limit with validation if using the old limit parameter
      const takeLimit = limit ? parseInt(limit as string) : validPageSize;
      const validTakeLimit = isNaN(takeLimit) || takeLimit <= 0 ? 10 : Math.min(takeLimit, 50);
      
      // Log the query for debugging
      console.log(`Events API: Fetching with filters:`, JSON.stringify(filter));
      console.log(`Events API: Pagination - page ${validPage}, pageSize ${validPageSize}, skip ${skip}`);
      
      // Start timing the database query
      const queryStartTime = Date.now();
      
      // First, get total count for pagination (using a separate query is more efficient than including count)
      const totalCount = await prisma.event.count({
        where: filter
      });
      
      // Fetch events based on filters with pagination
      const events = await prisma.event.findMany({
        where: filter,
        orderBy: {
          startDate: 'asc',
        },
        skip,
        take: validPageSize,
        // Only select the fields that are actually needed to reduce data transfer
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
          createdAt: true,
          updatedAt: true,
          // Include startup call details if needed
          startupCall: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });
      
      // Log query performance
      const queryEndTime = Date.now();
      console.log(`Events API: Database query took ${queryEndTime - queryStartTime}ms`);
      
      // Return data in a paginated format
      const response = {
        data: events,
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validPageSize)
        },
        meta: {
          queryTimeMs: queryEndTime - queryStartTime,
          totalTimeMs: queryEndTime - startTime
        }
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // Log end time for error case
      const endTime = Date.now();
      console.error(`Events API: Request failed after ${endTime - startTime}ms`);
      
      return res.status(500).json({
        message: 'An error occurred while fetching events.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
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
        imageUrl,
        startupCallId
      } = req.body;
      
      // Validate required fields
      if (!title || !startDate || !endDate || !type) {
        return res.status(400).json({
          message: 'Missing required fields: title, startDate, endDate, and type are required.',
        });
      }
      
      // Parse dates to ensure they're valid
      let parsedStartDate: Date;
      let parsedEndDate: Date;
      
      try {
        parsedStartDate = new Date(startDate);
        parsedEndDate = new Date(endDate);
        
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (e) {
        return res.status(400).json({
          message: 'Invalid date format for startDate or endDate.',
        });
      }
      
      // Create event
      const event = await prisma.event.create({
        data: {
          title,
          description: description || "",
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          location,
          type,
          isVirtual: isVirtual || false,
          virtualLink,
          imageUrl,
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