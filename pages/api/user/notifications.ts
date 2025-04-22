import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure user is authenticated
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    if (req.method === 'GET') {
      // Get limit and offset from query params
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const onlyUnread = req.query.onlyUnread === 'true';
      
      // Fetch notifications for the current user
      const notifications = await withPrisma(() =>
        prisma.notification.findMany({
          where: {
            userId: session.user.id,
            ...(onlyUnread ? { read: false } : {}),
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        })
      );
      
      // Count total notifications and unread notifications
      const totalCount = await withPrisma(() =>
        prisma.notification.count({
          where: {
            userId: session.user.id,
          },
        })
      );
      
      const unreadCount = await withPrisma(() =>
        prisma.notification.count({
          where: {
            userId: session.user.id,
            read: false,
          },
        })
      );
      
      return res.status(200).json({
        notifications,
        totalCount,
        unreadCount,
      });
    } else if (req.method === 'PUT') {
      // Mark notifications as read
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'Invalid notification IDs' });
      }
      
      // Update the notifications
      await withPrisma(() =>
        prisma.notification.updateMany({
          where: {
            id: {
              in: ids,
            },
            userId: session.user.id, // Ensure user can only update their own notifications
          },
          data: {
            read: true,
          },
        })
      );
      
      return res.status(200).json({ message: 'Notifications marked as read' });
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error processing notification request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 