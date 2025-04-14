import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './../../../pages/api/auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { Role } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Only allow admins to access this endpoint
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || session?.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    // Find all users who have a USER role or no role
    const usersWithoutRole = await prisma.user.findMany({
      where: {
        OR: [
          { role: Role.USER },
        ]
      }
    });

    // Count of users to be updated
    const userCount = usersWithoutRole.length;

    // Update all users without a role to have the ENTREPRENEUR role
    await prisma.user.updateMany({
      where: {
        OR: [
          { role: Role.USER },
        ]
      },
      data: {
        role: Role.ENTREPRENEUR,
      }
    });

    return res.status(200).json({ 
      message: `Success! Updated ${userCount} users.`,
      updatedCount: userCount,
      updatedUsers: usersWithoutRole.map(u => u.email)
    });
  } catch (error) {
    console.error('Error fixing social users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 