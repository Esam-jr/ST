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

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSponsorshipOpportunities(req, res, session);
    case 'POST':
      return createSponsorshipOpportunity(req, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get sponsorship opportunities with optional filtering
async function getSponsorshipOpportunities(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { status } = req.query;
    
    // Create filter based on query parameters
    const filter: any = {};
    
    // Filter by status if provided
    if (status) {
      filter.status = status === 'active' 
        ? 'active' 
        : status === 'closed' 
          ? 'closed' 
          : status === 'draft' 
            ? 'draft' 
            : status === 'archived' 
              ? 'archived' 
              : undefined;
    }
    
    // If user is not admin, only show active opportunities unless they're specifically requesting their own
    if (session.user.role !== 'ADMIN' && req.query.own !== 'true') {
      filter.status = 'active';
    }
    
    const opportunities = await prisma.sponsorshipOpportunity.findMany({
      where: filter,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(opportunities);
  } catch (error) {
    console.error('Error fetching sponsorship opportunities:', error);
    return res.status(500).json({ error: 'Failed to fetch sponsorship opportunities' });
  }
}

// Create a new sponsorship opportunity
async function createSponsorshipOpportunity(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Only admins can create sponsorship opportunities
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can create sponsorship opportunities' });
    }

    const {
      title,
      description,
      benefits,
      minAmount,
      maxAmount,
      currency,
      status = 'draft', // Default to draft
      startupCallId,
      deadline,
    } = req.body;

    // Basic validation
    if (!title || !description || !minAmount || !maxAmount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amounts
    if (minAmount <= 0 || maxAmount <= 0 || minAmount > maxAmount) {
      return res.status(400).json({ error: 'Invalid amount values' });
    }

    // Create the opportunity
    const opportunity = await prisma.sponsorshipOpportunity.create({
      data: {
        title,
        description,
        benefits: Array.isArray(benefits) ? benefits : [],
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        currency,
        status,
        startupCallId: startupCallId || null,
        // Additional fields can be added as needed
      },
    });

    return res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating sponsorship opportunity:', error);
    return res.status(500).json({ error: 'Failed to create sponsorship opportunity' });
  }
} 