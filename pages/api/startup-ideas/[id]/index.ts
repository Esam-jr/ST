import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const startupIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  industry: z.array(z.string()).min(1, 'At least one industry must be selected'),
  coverImage: z.string().optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
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
    return res.status(400).json({ error: 'Invalid idea ID' });
  }

  // GET /api/startup-ideas/[id]
  if (req.method === 'GET') {
    try {
      const idea = await prisma.startupIdea.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Check if the current user has liked the idea
      const like = session ? await prisma.like.findUnique({
        where: {
          ideaId_userId: {
            userId: session.user.id,
            ideaId: id,
          },
        },
      }) : null;

      return res.json({
        ...idea,
        isLiked: !!like,
      });
    } catch (error) {
      console.error('Error fetching idea:', error);
      return res.status(500).json({ error: 'Failed to fetch idea' });
    }
  }

  // PUT /api/startup-ideas/[id]
  if (req.method === 'PUT') {
    try {
      const idea = await prisma.startupIdea.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      if (idea.userId !== session.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this idea' });
      }

      const validatedData = startupIdeaSchema.parse(req.body);

      const updatedIdea = await prisma.startupIdea.update({
        where: { id },
        data: validatedData,
      });

      return res.json(updatedIdea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating idea:', error);
      return res.status(500).json({ error: 'Failed to update idea' });
    }
  }

  // DELETE /api/startup-ideas/[id]
  if (req.method === 'DELETE') {
    try {
      const idea = await prisma.startupIdea.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      if (idea.userId !== session.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this idea' });
      }

      await prisma.startupIdea.delete({
        where: { id },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting idea:', error);
      return res.status(500).json({ error: 'Failed to delete idea' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 