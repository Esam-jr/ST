import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define interfaces to match Prisma schema
interface SponsorshipApplication {
  id: string;
  sponsorId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: Date | null;
  startupCallId: string | null;
  createdAt: Date;
  updatedAt: Date;
  startupCall?: {
    id: string;
    title: string;
  } | null;
  applications?: SponsorshipApplication[];
}

// Define schema for updating a sponsorship opportunity
const updateOpportunitySchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title must not exceed 100 characters' })
    .optional(),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must not exceed 2000 characters' })
    .optional(),
  benefits: z.array(
    z.string().min(1, { message: 'Benefit cannot be empty' })
      .max(200, { message: 'Benefit must not exceed 200 characters' })
  ).min(1, { message: 'At least one benefit is required' })
    .optional(),
  minAmount: z.coerce.number().positive({ message: 'Min amount must be positive' })
    .optional(),
  maxAmount: z.coerce.number().positive({ message: 'Max amount must be positive' })
    .optional(),
  currency: z.string().min(1, { message: 'Currency is required' })
    .optional(),
  startupCallId: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'closed', 'archived'])
    .optional(),
  deadline: z.string().optional().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Check if the ID is valid
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins can modify opportunities
  if (req.method !== 'GET' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required for this operation' });
  }

  try {
    // Check if the opportunity exists
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
        applications: {
          select: {
            id: true,
            sponsorId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }) as SponsorshipOpportunity | null;

    if (!opportunity) {
      return res.status(404).json({ message: 'Sponsorship opportunity not found' });
    }

    // Handle GET request (view opportunity)
    if (req.method === 'GET') {
      // Non-admin users can only view active opportunities
      // Check status case-insensitively
      if (session.user.role !== 'ADMIN' && opportunity.status.toUpperCase() !== 'ACTIVE') {
        return res.status(403).json({ message: 'This opportunity is not available for viewing' });
      }
      
      return res.status(200).json(opportunity);
    }
    
    // Handle PATCH request (update opportunity)
    else if (req.method === 'PATCH') {
      // Validate request body
      const validationResult = updateOpportunitySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }
      
      const data = validationResult.data;
      
      // Prepare update data
      const updateData: any = {};
      
      // Only include fields that were provided in the request
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.benefits) updateData.benefits = data.benefits;
      if (data.minAmount !== undefined) updateData.minAmount = data.minAmount;
      if (data.maxAmount !== undefined) updateData.maxAmount = data.maxAmount;
      if (data.currency) updateData.currency = data.currency;
      if (data.status) updateData.status = data.status.toUpperCase();

      // Format deadline if provided
      if (data.deadline !== undefined) {
        updateData.deadline = data.deadline ? new Date(data.deadline) : null;
        
        // Check if the deadline is in the future
        if (updateData.deadline && updateData.deadline <= new Date()) {
          return res.status(400).json({
            message: 'Validation error',
            errors: [{ path: ['deadline'], message: 'Deadline must be in the future' }]
          });
        }
      }
      
      // Restrict changes if applications exist
      if (opportunity.applications && opportunity.applications.length > 0) {
        // Don't allow changing currency if applications exist
        if (data.currency && data.currency !== opportunity.currency) {
          return res.status(400).json({
            message: 'Cannot change currency for opportunities with existing applications',
          });
        }
      }
      
      // Handle startup call connection/disconnection
      if (data.startupCallId !== undefined) {
        if (data.startupCallId) {
          // Try to connect to the provided startup call ID
          updateData.startupCall = {
            connect: { id: data.startupCallId }
          };
        } else {
          // Disconnect from current startup call
          updateData.startupCall = {
            disconnect: true
          };
        }
      }
      
      // Update the opportunity
      const updatedOpportunity = await prisma.sponsorshipOpportunity.update({
        where: { id },
        data: updateData,
        include: {
          startupCall: {
            select: {
              id: true,
              title: true,
            },
          },
          applications: {
            select: {
              id: true,
            },
          },
        },
      }) as SponsorshipOpportunity;
      
      return res.status(200).json(updatedOpportunity);
    }
    
    // Handle DELETE request (delete opportunity)
    else if (req.method === 'DELETE') {
      // Prevent deletion if there are existing applications
      if (opportunity.applications && opportunity.applications.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete opportunity with existing applications'
        });
      }
      
      // Delete the opportunity
      await prisma.sponsorshipOpportunity.delete({
        where: { id }
      });
      
      return res.status(204).end();
    }
    
    // Handle unsupported methods
    else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error handling sponsorship opportunity:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      // Cast to any to access code
      const prismaError = error as any;
      
      if (prismaError.code === 'P2025') {
        return res.status(404).json({ 
          message: 'Resource not found',
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
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 