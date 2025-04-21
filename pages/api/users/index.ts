import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is an admin
    const user = await withPrisma(() => 
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    );

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view users' });
    }

    // Get role filter from query params
    const { role } = req.query;
    
    // Build the where clause based on role filter
    let whereClause = {};
    if (role) {
      whereClause = {
        role: role as 'USER' | 'ENTREPRENEUR' | 'REVIEWER' | 'SPONSOR' | 'ADMIN'
      };
    }

    // Fetch users based on filters
    const users = await withPrisma(() =>
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      })
    );

    return res.status(200).json(users);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 