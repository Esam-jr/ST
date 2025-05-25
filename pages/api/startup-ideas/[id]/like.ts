import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

  // POST /api/startup-ideas/[id]/like
  if (req.method === 'POST') {
    try {
      // Check if the idea exists
      const idea = await prisma.startupIdea.findUnique({
        where: { id },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Check if the user has already liked the idea
      const existingLike = await prisma.like.findUnique({
        where: {
          ideaId_userId: {
            ideaId: id,
            userId: session.user.id,
          },
        },
      });

      if (existingLike) {
        // Unlike if already liked
        await prisma.like.delete({
          where: {
            ideaId_userId: {
              ideaId: id,
              userId: session.user.id,
            },
          },
        });
        return res.json({ liked: false });
      } else {
        // Like if not already liked
        await prisma.like.create({
          data: {
            ideaId: id,
            userId: session.user.id,
          },
        });
        return res.json({ liked: true });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      return res.status(500).json({ error: 'Failed to process like' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 