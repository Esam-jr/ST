import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define schema for updating an application
const updateApplicationSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
  adminMessage: z.string().optional(),
});

// Interface representing the application with included relations
interface ApplicationWithRelations {
  id: string;
  status: string;
  opportunity: {
    id: string;
    title: string;
  };
  sponsor: {
    id: string;
    name: string;
    email: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Check if the ID is valid
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid application ID' });
  }

  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Get the application with related data
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id },
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

    if (!application) {
      return res.status(404).json({ message: 'Sponsorship application not found' });
    }

    // Check permissions - only admins or the application owner can access it
    if (session.user.role !== 'ADMIN' && session.user.id !== application.sponsor.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this application' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      return res.status(200).json(application);
    }
    
    // Handle PATCH request - update application status (admin only)
    else if (req.method === 'PATCH') {
      // Only admins can update application status
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can update application status' });
      }
      
      // Validate request body
      const validationResult = updateApplicationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }
      
      const { status, adminMessage } = validationResult.data;
      
      // Check if the application can be updated (not already accepted or rejected)
      if (application.status !== 'PENDING' && status !== application.status) {
        return res.status(400).json({
          message: `Cannot change status from ${application.status} to ${status}`
        });
      }
      
      // Update the application (note: schema doesn't have adminMessage, so we don't include it)
      const updatedApplication = await prisma.sponsorshipApplication.update({
        where: { id },
        data: {
          status,
          // Add message to the message field instead, if provided
          message: adminMessage || application.message
        },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
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
      }) as unknown as ApplicationWithRelations;
      
      // Create notification for the sponsor about the status change
      await prisma.notification.create({
        data: {
          userId: updatedApplication.sponsor.id,
          title: `Application ${status.toLowerCase()}`,
          message: `Your application for "${updatedApplication.opportunity.title}" has been ${status.toLowerCase()}.`,
          type: `APPLICATION_${status}`,
          read: false,
          link: `/sponsor/applications/${id}`,
        }
      }).catch(error => {
        // Log but don't fail the request if notification creation fails
        console.error('Error creating notification:', error);
      });
      
      return res.status(200).json(updatedApplication);
    }
    
    // Handle DELETE request (admin only)
    else if (req.method === 'DELETE') {
      // Only admins can delete applications
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can delete applications' });
      }
      
      // Delete the application
      await prisma.sponsorshipApplication.delete({
        where: { id }
      });
      
      return res.status(204).end();
    }
    
    // Handle unsupported methods
    else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error handling sponsorship application:', error);
    
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
    }
    
    return res.status(500).json({ 
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 