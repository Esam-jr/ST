import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

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
      const advertisements = await prisma.advertisement.findMany({
        orderBy: {
          scheduledDate: 'desc',
        },
      });
      return res.status(200).json(advertisements);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return res.status(500).json({ error: 'Failed to fetch advertisements' });
    }
  }

  if (req.method === 'POST') {
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, content, imageUrl, scheduledDate, platforms } = req.body;

    if (!title || !content || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Create advertisement in database
      const advertisement = await prisma.advertisement.create({
        data: {
          title,
          content,
          imageUrl,
          scheduledDate: new Date(scheduledDate),
          platforms: platforms || [],
          status: 'draft',
        },
      });

      return res.status(201).json(advertisement);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      return res.status(500).json({ error: 'Failed to create advertisement' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 