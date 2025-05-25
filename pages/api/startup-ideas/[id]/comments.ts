import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
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

  // GET /api/startup-ideas/[id]/comments
  if (req.method === 'GET') {
    try {
      const comments = await prisma.ideaComment.findMany({
        where: { ideaId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  // POST /api/startup-ideas/[id]/comments
  if (req.method === 'POST') {
    try {
      // Check if the idea exists
      const idea = await prisma.startupIdea.findUnique({
        where: { id },
      });

      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      const validatedData = commentSchema.parse(req.body);

      const comment = await prisma.ideaComment.create({
        data: {
          content: validatedData.content,
          ideaId: id,
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  }

  // DELETE /api/startup-ideas/[id]/comments?commentId=xxx
  if (req.method === 'DELETE') {
    const { commentId } = req.query;

    if (!commentId || typeof commentId !== 'string') {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    try {
      const comment = await prisma.ideaComment.findUnique({
        where: { id: commentId },
        select: { userId: true },
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      await prisma.ideaComment.delete({
        where: { id: commentId },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 