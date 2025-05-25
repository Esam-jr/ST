import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        search = '', 
        role = 'all', 
        page = '1', 
        limit = '10' 
      } = req.query;

      // Build filter conditions
      const where: Prisma.UserWhereInput = {
        AND: [
          // Search filter
          {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
            ],
          },
          // Role filter
          ...(role !== 'all' ? [{ role: role as Role }] : []),
        ],
      };

      // Get total count for pagination
      const total = await prisma.user.count({ where });

      // Fetch users with pagination
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          // Add any additional fields you need
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      // Get role statistics
      const roleStats = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      // Format role stats
      const stats = {
        total,
        roles: Object.fromEntries(
          roleStats.map(({ role, _count }) => [role.toLowerCase(), _count])
        ),
      };

      return res.status(200).json({
        users,
        stats,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 