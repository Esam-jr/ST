import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Allow public access to GET endpoints for active opportunities
  if (req.method === 'GET' && req.query.status === 'active') {
    return getSponsorshipOpportunities(req, res);
  }

  // Check authentication for all other requests
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getSponsorshipOpportunities(req, res, session);
    case 'POST':
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return createSponsorshipOpportunity(req, res, session);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getSponsorshipOpportunities(req: NextApiRequest, res: NextApiResponse, session?: any) {
  try {
    const { status } = req.query;
    
    // Build filter conditions based on query parameters
    const whereConditions: any = {};
    
    // Filter by status if provided
    if (status) {
      if (typeof status === 'string') {
        whereConditions.status = status.toUpperCase();
      } else if (Array.isArray(status)) {
        whereConditions.status = { in: status.map(s => s.toUpperCase()) };
      }
    }
    
    // Only admins can see all opportunities, others only see active ones
    if (!session || session.user.role !== 'ADMIN') {
      whereConditions.status = 'ACTIVE';
    }
    
    const opportunities = await prisma.sponsorshipOpportunity.findMany({
      where: whereConditions,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return res.status(200).json(opportunities);
  } catch (error) {
    console.error('Error fetching sponsorship opportunities:', error);
    return res.status(500).json({ message: 'Failed to fetch sponsorship opportunities' });
  }
}

async function createSponsorshipOpportunity(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { 
      title, 
      description, 
      benefits, 
      minAmount, 
      maxAmount, 
      currency, 
      status = 'DRAFT',
      startupCallId,
      deadline 
    } = req.body;
    
    if (!title || !description || minAmount === undefined || maxAmount === undefined || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate numeric fields
    if (isNaN(minAmount) || isNaN(maxAmount) || minAmount < 0 || maxAmount < minAmount) {
      return res.status(400).json({ message: 'Invalid amount values' });
    }
    
    const opportunity = await prisma.sponsorshipOpportunity.create({
      data: {
        title,
        description,
        benefits,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        currency,
        status,
        startupCallId: startupCallId || null,
        deadline: deadline ? new Date(deadline) : null,
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });
    
    return res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating sponsorship opportunity:', error);
    return res.status(500).json({ message: 'Failed to create sponsorship opportunity' });
  }
} 