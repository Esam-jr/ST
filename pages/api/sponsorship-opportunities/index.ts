import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define the schema for creating a sponsorship opportunity
const createOpportunitySchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title must not exceed 100 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must not exceed 2000 characters' }),
  benefits: z.array(
    z.string().min(1, { message: 'Benefit cannot be empty' })
      .max(200, { message: 'Benefit must not exceed 200 characters' })
  ).min(1, { message: 'At least one benefit is required' }),
  minAmount: z.coerce.number().positive({ message: 'Min amount must be positive' }),
  maxAmount: z.coerce.number().positive({ message: 'Max amount must be positive' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  startupCallId: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'closed', 'archived']),
  deadline: z.string().optional().nullable()
}).refine(data => data.maxAmount >= data.minAmount, {
  message: "Maximum amount must be greater than or equal to minimum amount",
  path: ["maxAmount"]
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins can access this endpoint
  if (session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  // Handle GET request to fetch all opportunities
  if (req.method === 'GET') {
    try {
      const opportunities = await prisma.sponsorshipOpportunity.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          startupCall: {
            select: {
              id: true,
              title: true
            }
          },
          applications: {
            select: {
              id: true
            }
          }
        }
      });
      
      return res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch sponsorship opportunities',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } 
  
  // Handle POST request to create a new opportunity
  else if (req.method === 'POST') {
    try {
      // Validate request body against schema
      const validationResult = createOpportunitySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }
      
      const data = validationResult.data;
      
      // Format the deadline if provided
      const deadline = data.deadline ? new Date(data.deadline) : null;
      
      // Check if the deadline is in the future
      if (deadline && deadline <= new Date()) {
        return res.status(400).json({
          message: 'Validation error',
          errors: [{ path: ['deadline'], message: 'Deadline must be in the future' }]
        });
      }
      
      // Create the opportunity with properly formatted data
      const createData: any = {
        title: data.title,
        description: data.description,
        benefits: data.benefits,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        currency: data.currency,
        status: data.status.toUpperCase(),
        createdById: session.user.id,
        // Connect to startup call if ID is provided
        startupCall: data.startupCallId ? {
          connect: { id: data.startupCallId }
        } : undefined
      };

      // Only add deadline if provided
      if (deadline) {
        createData.deadline = deadline;
      }
      
      const createdOpportunity = await prisma.sponsorshipOpportunity.create({
        data: createData,
        include: {
          startupCall: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });
      
      return res.status(201).json(createdOpportunity);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      
      // Handle Prisma-specific errors
      if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        // Cast to any to access code
        const prismaError = error as any;
        
        if (prismaError.code === 'P2025') {
          return res.status(404).json({ 
            message: 'Startup call not found',
            error: error.message
          });
        }
        
        if (prismaError.code === 'P2002') {
          return res.status(409).json({ 
            message: 'Duplicate entry',
            error: error.message
          });
        }
      }
      
      return res.status(500).json({ 
        message: 'Failed to create sponsorship opportunity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } 
  
  // Handle unsupported methods
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
} 