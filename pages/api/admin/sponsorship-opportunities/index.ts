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

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getOpportunities(req, res);
    case 'POST':
      return createOpportunity(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all sponsorship opportunities
async function getOpportunities(req: NextApiRequest, res: NextApiResponse) {
  try {
    const opportunities = await prisma.sponsorshipOpportunity.findMany({
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return res.status(500).json({ message: 'Failed to fetch opportunities' });
  }
}

// Create a new sponsorship opportunity
async function createOpportunity(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    const opportunity = await prisma.sponsorshipOpportunity.create({
      data: {
        title,
        description,
        benefits,
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        currency,
        status: status || 'DRAFT',
        deadline: deadline ? new Date(deadline) : null,
        startupCallId,
        createdById: session.user.id,
      },
    });

    return res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return res.status(500).json({ message: 'Failed to create opportunity' });
  }
} 