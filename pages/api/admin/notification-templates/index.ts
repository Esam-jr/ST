import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (req.method === 'GET') {
    try {
      const templates = await prisma.notificationTemplate.findMany({
        where: {
          type: 'SPONSORSHIP_APPLICATION',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return res.status(200).json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ message: 'Failed to fetch templates' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, subject, emailContent, notificationContent, status } = req.body;

      const template = await prisma.notificationTemplate.create({
        data: {
          name,
          type: 'SPONSORSHIP_APPLICATION',
          subject,
          emailContent,
          notificationContent,
          status,
          createdBy: session.user.id,
        },
      });

      return res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({ message: 'Failed to create template' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 