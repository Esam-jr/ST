import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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
    return res.status(400).json({ error: 'Invalid opportunity ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSponsorshipOpportunity(req, res, session, id);
    case 'PATCH':
      return updateSponsorshipOpportunity(req, res, session, id);
    case 'DELETE':
      return deleteSponsorshipOpportunity(req, res, session, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get a specific sponsorship opportunity
async function getSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Check if the opportunity exists
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Sponsorship opportunity not found' });
    }

    // If not admin and the opportunity is not active, don't allow access
    if (session.user.role !== 'ADMIN' && opportunity.status !== 'active') {
      return res.status(403).json({ error: 'Access to this opportunity is restricted' });
    }

    return res.status(200).json(opportunity);
  } catch (error) {
    console.error('Error fetching sponsorship opportunity:', error);
    return res.status(500).json({ error: 'Failed to fetch sponsorship opportunity' });
  }
}

// Update a sponsorship opportunity
async function updateSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Only admins can update sponsorship opportunities
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can update sponsorship opportunities' });
    }

    // Check if the opportunity exists
    const existingOpportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!existingOpportunity) {
      return res.status(404).json({ error: 'Sponsorship opportunity not found' });
    }

    const {
      title,
      description,
      benefits,
      minAmount,
      maxAmount,
      currency,
      status,
      startupCallId,
      deadline,
    } = req.body;

    // Validate status changes
    if (status && status !== existingOpportunity.status) {
      // If there are applications and trying to change to draft, don't allow
      if (status === 'draft' && existingOpportunity._count.applications > 0) {
        return res.status(400).json({ 
          error: 'Cannot change status to draft because there are existing applications' 
        });
      }
    }

    // Prepare the update data
    const updateData: any = {};

    // Only include fields that were provided in the request
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (minAmount !== undefined) updateData.minAmount = Number(minAmount);
    if (maxAmount !== undefined) updateData.maxAmount = Number(maxAmount);
    if (currency !== undefined) updateData.currency = currency;
    if (status !== undefined) updateData.status = status;
    if (startupCallId !== undefined) updateData.startupCallId = startupCallId || null;
    if (deadline !== undefined) updateData.deadline = deadline || null;

    // If both min and max amount are provided, validate their relationship
    if (updateData.minAmount !== undefined && updateData.maxAmount !== undefined) {
      if (updateData.minAmount > updateData.maxAmount) {
        return res.status(400).json({ error: 'Minimum amount cannot be greater than maximum amount' });
      }
    } else if (updateData.minAmount !== undefined && updateData.minAmount > existingOpportunity.maxAmount) {
      return res.status(400).json({ error: 'Minimum amount cannot be greater than the existing maximum amount' });
    } else if (updateData.maxAmount !== undefined && updateData.maxAmount < existingOpportunity.minAmount) {
      return res.status(400).json({ error: 'Maximum amount cannot be less than the existing minimum amount' });
    }

    // Update the opportunity
    const updatedOpportunity = await prisma.sponsorshipOpportunity.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating sponsorship opportunity:', error);
    return res.status(500).json({ error: 'Failed to update sponsorship opportunity' });
  }
}

// Delete a sponsorship opportunity
async function deleteSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Only admins can delete sponsorship opportunities
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can delete sponsorship opportunities' });
    }

    // Check if the opportunity exists
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Sponsorship opportunity not found' });
    }

    // Only allow deletion if there are no applications or if it's in draft status
    if (opportunity._count.applications > 0 && opportunity.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot delete this opportunity because it has applications. Consider archiving it instead.' 
      });
    }

    // Delete the opportunity
    await prisma.sponsorshipOpportunity.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Sponsorship opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsorship opportunity:', error);
    return res.status(500).json({ error: 'Failed to delete sponsorship opportunity' });
  }
} 