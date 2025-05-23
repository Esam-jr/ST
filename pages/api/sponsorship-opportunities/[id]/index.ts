import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import slugify from 'slugify';

// Define interfaces to match Prisma schema
interface SponsorshipApplication {
  id: string;
  sponsorId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: Date | null;
  startupCallId: string | null;
  createdAt: Date;
  updatedAt: Date;
  startupCall?: {
    id: string;
    title: string;
  } | null;
  applications?: SponsorshipApplication[];
}

// Define schema for updating a sponsorship opportunity
const updateOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().optional(),
  description: z.string().min(1, 'Description is required').optional(),
  benefits: z.array(z.string()).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  industryFocus: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    try {
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            title: true,
          },
        },
          createdBy: {
          select: {
              name: true,
              email: true,
          },
        },
      },
      });

    if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
      
      return res.status(200).json(opportunity);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      return res.status(500).json({ error: 'Failed to fetch opportunity' });
    }
  }

  if (req.method === 'PUT') {
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
        }

    try {
      const validatedData = updateOpportunitySchema.parse(req.body);

      // If title is being updated, generate a new slug
      let updateData = { ...validatedData };
      if (validatedData.title) {
        updateData = {
          ...updateData,
          slug: validatedData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          };
        }

      const opportunity = await prisma.sponsorshipOpportunity.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating opportunity:', error);
      return res.status(500).json({ error: 'Failed to update opportunity' });
    }
  }

  if (req.method === 'DELETE') {
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
      }
      
    try {
      await prisma.sponsorshipOpportunity.delete({
        where: { id },
      });
      
      return res.status(204).end();
  } catch (error) {
      console.error('Error deleting opportunity:', error);
      return res.status(500).json({ error: 'Failed to delete opportunity' });
      }
    }
    
  return res.status(405).json({ error: 'Method not allowed' });
} 