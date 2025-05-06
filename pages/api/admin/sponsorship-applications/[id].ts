import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // Get application ID from URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid application ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getApplication(req, res, id);
    case 'PATCH':
    case 'PUT':
      return updateApplication(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single sponsorship application
async function getApplication(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            minAmount: true,
            maxAmount: true,
            currency: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ message: 'Failed to fetch application' });
  }
}

// Update a sponsorship application
async function updateApplication(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the application exists
    const existingApplication = await prisma.sponsorshipApplication.findUnique({
      where: { id },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Extract status from request body
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Update the application
    const updatedApplication = await prisma.sponsorshipApplication.update({
      where: { id },
      data: { status },
    });

    // Create notification for the sponsor
    if (status !== existingApplication.status) {
      try {
        await prisma.notification.create({
          data: {
            userId: existingApplication.sponsorId,
            title: 'Application Status Updated',
            message: `Your application for "${existingApplication.opportunity.title}" has been ${status.toLowerCase()}.`,
            type: 'APPLICATION_STATUS',
            read: false,
            link: `/my-applications`,
          },
        });
      } catch (error) {
        console.error('Error creating notification:', error);
        // Continue even if notification fails
      }
    }

    return res.status(200).json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return res.status(500).json({ message: 'Failed to update application' });
  }
} 