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

  // Get opportunity ID from URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid opportunity ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getOpportunity(req, res, id);
    case 'PATCH':
    case 'PUT':
      return updateOpportunity(req, res, id);
    case 'DELETE':
      return deleteOpportunity(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single sponsorship opportunity
async function getOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    return res.status(200).json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return res.status(500).json({ message: 'Failed to fetch opportunity' });
  }
}

// Update a sponsorship opportunity
async function updateOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the opportunity exists
    const existingOpportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
    });

    if (!existingOpportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Extract request body data
    const { 
      title, 
      description, 
      benefits, 
      minAmount, 
      maxAmount, 
      currency, 
      status, 
      deadline, 
      startupCallId 
    } = req.body;

    // Update the opportunity
    const updatedOpportunity = await prisma.sponsorshipOpportunity.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(benefits && { benefits }),
        ...(minAmount !== undefined && { minAmount: parseFloat(minAmount) }),
        ...(maxAmount !== undefined && { maxAmount: parseFloat(maxAmount) }),
        ...(currency && { currency }),
        ...(status && { status }),
        ...(deadline !== undefined && { 
          deadline: deadline ? new Date(deadline) : null 
        }),
        ...(startupCallId && { startupCallId }),
      },
    });

    return res.status(200).json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return res.status(500).json({ message: 'Failed to update opportunity' });
  }
}

// Delete a sponsorship opportunity
async function deleteOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Check if there are applications for this opportunity
    if (existingOpportunity._count.applications > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete an opportunity with existing applications' 
      });
    }

    // Delete the opportunity
    await prisma.sponsorshipOpportunity.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return res.status(500).json({ message: 'Failed to delete opportunity' });
  }
} 