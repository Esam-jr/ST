import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions) as Session & { user: { role: string } };
  
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
      return createOpportunity(req, res, session);
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
async function createOpportunity(req: NextApiRequest, res: NextApiResponse, session: Session & { user: { id: string } }) {
  const { 
    title, 
    description, 
    benefits, 
    minAmount, 
    maxAmount, 
    currency, 
    status, 
    deadline,
    startupCallId,
    industryFocus,
    tags,
    eligibility,
    coverImage,
    visibility,
    tiers
  } = req.body;

  try {
    // Validate required fields
    if (!title || !description || !benefits || !minAmount || !maxAmount || !currency || !status || !startupCallId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'benefits', 'minAmount', 'maxAmount', 'currency', 'status', 'startupCallId']
      });
    }

    // Validate startup call exists
    const startupCall = await prisma.startupCall.findUnique({
      where: { id: startupCallId }
    });

    if (!startupCall) {
      return res.status(400).json({ message: 'Invalid startup call ID' });
    }

    // Generate slug from title
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and append number if it does
    while (true) {
      const existing = await prisma.sponsorshipOpportunity.findUnique({
        where: { slug }
      });
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const data: Prisma.SponsorshipOpportunityCreateInput = {
      title,
      slug,
      description,
      benefits,
      minAmount: parseFloat(minAmount),
      maxAmount: parseFloat(maxAmount),
      currency,
      status: status || 'DRAFT',
      deadline: deadline ? new Date(deadline) : null,
      startupCall: {
        connect: { id: startupCallId }
      },
      industryFocus,
      tags: tags || [],
      eligibility,
      coverImage,
      visibility: visibility || 'PUBLIC',
      tiers: tiers ? tiers as Prisma.InputJsonValue : Prisma.JsonNull,
      createdBy: {
        connect: { id: session.user.id }
      }
    };

    const opportunity = await prisma.sponsorshipOpportunity.create({
      data
    });

    return res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return res.status(500).json({ message: 'Failed to create opportunity' });
  }
} 