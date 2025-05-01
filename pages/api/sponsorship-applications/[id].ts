import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSponsorshipApplication(req, res, session, id);
    case 'PATCH':
      return updateSponsorshipApplication(req, res, session, id);
    case 'DELETE':
      return deleteSponsorshipApplication(req, res, session, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get a specific sponsorship application
async function getSponsorshipApplication(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Find the application
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            title: true,
            description: true,
            minAmount: true,
            maxAmount: true,
            currency: true,
            benefits: true,
            status: true,
            deadline: true,
            startupCallId: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check permissions: admins can see any application, sponsors can only see their own
    if (session.user.role !== 'ADMIN' && application.sponsorId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this application' });
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching sponsorship application:', error);
    return res.status(500).json({ error: 'Failed to fetch sponsorship application' });
  }
}

// Update a sponsorship application
async function updateSponsorshipApplication(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Find the application
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check permissions based on the update being performed
    const { status, message, amount, currency } = req.body;

    // Sponsors can only withdraw their own applications
    if (session.user.role === 'SPONSOR') {
      // Verify it's their own application
      if (application.sponsorId !== session.user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update this application' });
      }

      // Sponsors can only change status to 'withdrawn' and only if it's currently 'pending'
      if (status && status !== 'withdrawn') {
        return res.status(403).json({ error: 'Forbidden: You can only withdraw your application' });
      }

      if (status === 'withdrawn' && application.status !== 'pending') {
        return res.status(400).json({ error: 'Cannot withdraw an application that is not pending' });
      }

      // Sponsors can only update the message, not other fields
      if ((amount !== undefined || currency !== undefined) && status !== 'withdrawn') {
        return res.status(403).json({ error: 'Forbidden: You cannot update the amount or currency' });
      }
    } 
    // Admins can change status to approved or rejected
    else if (session.user.role === 'ADMIN') {
      // Admin can only update status
      if (amount !== undefined || currency !== undefined) {
        return res.status(400).json({ error: 'Cannot update amount or currency, only status' });
      }

      // Validate status transitions
      if (status && !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      // Cannot change status if it's already withdrawn
      if (application.status === 'withdrawn' && status !== 'withdrawn') {
        return res.status(400).json({ error: 'Cannot change status of a withdrawn application' });
      }
    }
    // Other roles cannot update applications
    else {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update applications' });
    }

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (message !== undefined && session.user.role === 'SPONSOR') updateData.message = message;

    // Update the application
    const updatedApplication = await prisma.sponsorshipApplication.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedApplication);
  } catch (error) {
    console.error('Error updating sponsorship application:', error);
    return res.status(500).json({ error: 'Failed to update sponsorship application' });
  }
}

// Delete a sponsorship application
async function deleteSponsorshipApplication(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Find the application
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Only admins or the sponsor who created the application can delete it
    if (session.user.role !== 'ADMIN' && application.sponsorId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this application' });
    }

    // Sponsors can only delete pending applications
    if (session.user.role === 'SPONSOR' && application.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete an application that is not pending' });
    }

    // Delete the application
    await prisma.sponsorshipApplication.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsorship application:', error);
    return res.status(500).json({ error: 'Failed to delete sponsorship application' });
  }
} 