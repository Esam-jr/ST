import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define interfaces for our types
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
}

// Define validation schema for creating an application
const createApplicationSchema = z.object({
  opportunityId: z.string().min(1, { message: 'Opportunity ID is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  message: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle GET request - retrieve applications
  if (req.method === 'GET') {
    try {
      const applications = await getApplicationsForUser(session.user.id, session.user.role);
      return res.status(200).json(applications);
    } catch (error) {
      console.error('Error fetching sponsorship applications:', error);
      return res.status(500).json({
        message: 'Failed to fetch sponsorship applications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle POST request - create new application
  else if (req.method === 'POST') {
    try {
      // Validate request data
      const validationResult = createApplicationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }
      
      const data = validationResult.data;
      
      // Get the opportunity to check if it exists and validate requirements
      const opportunity = await prisma.sponsorshipOpportunity.findUnique({
        where: { id: data.opportunityId }
      }) as SponsorshipOpportunity | null;
      
      if (!opportunity) {
        return res.status(404).json({ message: 'Sponsorship opportunity not found' });
      }
      
      // Check if opportunity is active (case-insensitive)
      if (opportunity.status.toUpperCase() !== 'ACTIVE') {
        return res.status(400).json({ message: 'This opportunity is not open for applications' });
      }
      
      // Check if deadline has passed
      if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
        return res.status(400).json({ message: 'The application deadline has passed' });
      }
      
      // Check currency
      if (data.currency !== opportunity.currency) {
        return res.status(400).json({ 
          message: `Currency must match the opportunity currency: ${opportunity.currency}` 
        });
      }
      
      // Check amount range
      if (data.amount < opportunity.minAmount || data.amount > opportunity.maxAmount) {
        return res.status(400).json({ 
          message: `Amount must be between ${opportunity.minAmount} and ${opportunity.maxAmount} ${opportunity.currency}` 
        });
      }
      
      // Check if user already has a pending or accepted application for this opportunity
      const existingApplication = await prisma.sponsorshipApplication.findFirst({
        where: {
          opportunityId: data.opportunityId,
          sponsorId: session.user.id,
          status: {
            in: ['PENDING', 'ACCEPTED']
          }
        }
      });
      
      if (existingApplication) {
        return res.status(409).json({ 
          message: 'You already have a pending or accepted application for this opportunity' 
        });
      }
      
      // Create the application
      const application = await prisma.sponsorshipApplication.create({
        data: {
          amount: data.amount,
          currency: data.currency,
          message: data.message || '',
          status: 'PENDING',
          opportunity: {
            connect: { id: data.opportunityId }
          },
          sponsor: {
            connect: { id: session.user.id }
          }
        },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          },
          sponsor: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      // TODO: Send notification to admins about new application
      
      return res.status(201).json(application);
    } catch (error) {
      console.error('Error creating sponsorship application:', error);
      
      // Handle Prisma-specific errors
      if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        // Cast to any to access code
        const prismaError = error as any;
        
        if (prismaError.code === 'P2025') {
          return res.status(404).json({ 
            message: 'Referenced resource not found',
            error: error.message
          });
        }
      }
      
      return res.status(500).json({
        message: 'Failed to create sponsorship application',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Handle other methods
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Helper function to get applications based on user role
async function getApplicationsForUser(userId: string, role: string) {
  // Admins can see all applications
  if (role === 'ADMIN') {
    return prisma.sponsorshipApplication.findMany({
      orderBy: {
        createdAt: 'desc'
      },
        include: {
          opportunity: {
            select: {
            id: true,
              title: true,
            currency: true,
              minAmount: true,
              maxAmount: true,
            status: true,
          }
        },
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }
  
  // Regular users (sponsors) can only see their own applications
  return prisma.sponsorshipApplication.findMany({
    where: {
      sponsorId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          currency: true,
          minAmount: true,
          maxAmount: true,
          status: true,
        }
      }
    }
  });
} 