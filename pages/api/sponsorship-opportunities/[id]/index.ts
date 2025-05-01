import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({ message: 'Missing opportunity ID' });
  }

  const session = await getServerSession(req, res, authOptions);

  // Allow public access to GET endpoint for active opportunities
  if (req.method === 'GET') {
    return getSponsorshipOpportunity(req, res, session, id);
  }

  // Check authentication for all other requests
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'PATCH':
    case 'PUT':
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return updateSponsorshipOpportunity(req, res, session, id);
    case 'DELETE':
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return deleteSponsorshipOpportunity(req, res, session, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any | null, 
  id: string
) {
  try {
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            id: true,
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
      return res.status(404).json({ message: 'Sponsorship opportunity not found' });
    }

    // If user is not admin and the opportunity is not active, restrict access
    if (!session || (session.user.role !== 'ADMIN' && opportunity.status !== 'ACTIVE')) {
      return res.status(403).json({ message: 'This opportunity is not currently available' });
    }

    return res.status(200).json(opportunity);
  } catch (error) {
    console.error('Error fetching sponsorship opportunity:', error);
    return res.status(500).json({ message: 'Failed to fetch sponsorship opportunity' });
  }
}

async function updateSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    const {
      title,
      description,
      benefits,
      minAmount,
      maxAmount,
      currency,
      status,
      startupCallId,
      deadline
    } = req.body;

    // Check if opportunity exists
    const existingOpportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
    });

    if (!existingOpportunity) {
      return res.status(404).json({ message: 'Sponsorship opportunity not found' });
    }

    // Validate amount fields if they are provided
    if (
      (minAmount !== undefined || maxAmount !== undefined) &&
      ((minAmount && isNaN(Number(minAmount))) ||
        (maxAmount && isNaN(Number(maxAmount))) ||
        (minAmount && Number(minAmount) < 0) ||
        (minAmount && maxAmount && Number(minAmount) > Number(maxAmount)))
    ) {
      return res.status(400).json({ message: 'Invalid amount values' });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (minAmount !== undefined) updateData.minAmount = Number(minAmount);
    if (maxAmount !== undefined) updateData.maxAmount = Number(maxAmount);
    if (currency !== undefined) updateData.currency = currency;
    if (status !== undefined) updateData.status = status;
    if (startupCallId !== undefined) updateData.startupCallId = startupCallId || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    
    // Update the opportunity
    const updatedOpportunity = await prisma.sponsorshipOpportunity.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating sponsorship opportunity:', error);
    return res.status(500).json({ message: 'Failed to update sponsorship opportunity' });
  }
}

async function deleteSponsorshipOpportunity(
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: any, 
  id: string
) {
  try {
    // Check if opportunity exists
    const existingOpportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        applications: true,
      },
    });

    if (!existingOpportunity) {
      return res.status(404).json({ message: 'Sponsorship opportunity not found' });
    }

    // Don't allow deletion if there are applications and it's not a draft
    if (existingOpportunity.applications.length > 0 && existingOpportunity.status !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Cannot delete opportunity with existing applications. Consider archiving instead.' 
      });
    }

    // Delete the opportunity
    await prisma.sponsorshipOpportunity.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Sponsorship opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsorship opportunity:', error);
    return res.status(500).json({ message: 'Failed to delete sponsorship opportunity' });
  }
} 