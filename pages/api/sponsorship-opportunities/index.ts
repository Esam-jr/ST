import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define the schema for creating a sponsorship opportunity
const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  benefits: z.array(z.string()),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  industryFocus: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']),
  eligibility: z.string().optional(),
  deadline: z.string().optional(),
  coverImage: z.string().optional(),
  startupCallId: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const opportunities = await prisma.sponsorshipOpportunity.findMany({
        include: {
          startupCall: {
            select: {
              title: true,
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
      return res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
  }

  if (req.method === 'POST') {
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const validatedData = createOpportunitySchema.parse(req.body);

      const opportunity = await prisma.sponsorshipOpportunity.create({
        data: {
          ...validatedData,
          slug: validatedData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          createdById: session.user.id,
        },
      });

      return res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating opportunity:', error);
      return res.status(500).json({ error: 'Failed to create opportunity' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 