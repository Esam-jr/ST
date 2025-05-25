import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface StartupIdeaWithRelations {
  id: string;
  title: string;
  description: string;
  industry: string[];
  coverImage: string | null;
  socialLinks: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, industry, sort = 'recent' } = req.query;
    const session = await getServerSession(req, res, authOptions);

    // Build the where clause for filtering
    const where: Prisma.StartupIdeaWhereInput = {
      status: 'PUBLISHED',
      ...(search && typeof search === 'string' ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(industry ? {
        industry: {
          hasSome: Array.isArray(industry) ? industry : [industry],
        },
      } : {}),
    };

    // Determine sorting
    const orderBy: Prisma.StartupIdeaOrderByWithRelationInput = 
      sort === 'most_liked'
        ? {
            likes: {
              _count: 'desc',
            },
          }
        : {
            createdAt: 'desc',
          };

    const ideas = await prisma.startupIdea.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy,
    }) as StartupIdeaWithRelations[];

    // If user is logged in, check which ideas they've liked
    if (session?.user?.id) {
      const likedIdeas = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          ideaId: {
            in: ideas.map((idea: StartupIdeaWithRelations) => idea.id),
          },
        },
        select: {
          ideaId: true,
        },
      });

      const likedIdeaIds = new Set(likedIdeas.map((like: { ideaId: string }) => like.ideaId));
      
      // Add isLiked field to each idea
      const ideasWithLikeStatus = ideas.map((idea: StartupIdeaWithRelations) => ({
        ...idea,
        isLiked: likedIdeaIds.has(idea.id),
      }));

      return res.json(ideasWithLikeStatus);
    }

    return res.json(ideas);
  } catch (error) {
    console.error('Error fetching startup ideas:', error);
    return res.status(500).json({ error: 'Failed to fetch startup ideas' });
  }
} 