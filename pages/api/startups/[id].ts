import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const { id } = req.query;

  // Check if the startup ID is provided
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Startup ID is required' });
  }

  // GET request - Retrieve startup details
  if (req.method === 'GET') {
    try {
      // Fetch the startup with related data
      const startup = await prisma.startup.findUnique({
        where: { id },
        include: {
          founder: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          milestones: {
            orderBy: { dueDate: 'asc' },
          },
          tasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { dueDate: 'asc' },
          },
          sponsorships: {
            include: {
              sponsor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          financials: {
            orderBy: { date: 'desc' },
          },
          documents: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
            },
            where: { parentId: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
      }

      // Check permissions
      // If the startup is in draft stage, only the founder can view it
      if (startup.status === 'DRAFT' && startup.founderId !== session?.user?.id && session?.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not have permission to view this startup' });
      }

      return res.status(200).json(startup);
    } catch (error) {
      console.error('Error fetching startup:', error);
      return res.status(500).json({ error: 'Failed to fetch startup details' });
    }
  }

  // PUT request - Update startup details
  else if (req.method === 'PUT') {
    // Only founder or admin can update
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const startup = await prisma.startup.findUnique({
        where: { id },
        select: { founderId: true },
      });

      if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
      }

      // Check if user is the founder or an admin
      if (startup.founderId !== session.user?.id && session.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not have permission to update this startup' });
      }

      const updateData = req.body;
      
      // Update the startup
      const updatedStartup = await prisma.startup.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json(updatedStartup);
    } catch (error) {
      console.error('Error updating startup:', error);
      return res.status(500).json({ error: 'Failed to update startup' });
    }
  }

  // DELETE request - Delete a startup
  else if (req.method === 'DELETE') {
    // Only founder or admin can delete
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const startup = await prisma.startup.findUnique({
        where: { id },
        select: { founderId: true },
      });

      if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
      }

      // Check if user is the founder or an admin
      if (startup.founderId !== session.user?.id && session.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not have permission to delete this startup' });
      }

      // Delete the startup and all related data
      await prisma.startup.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Startup deleted successfully' });
    } catch (error) {
      console.error('Error deleting startup:', error);
      return res.status(500).json({ error: 'Failed to delete startup' });
    }
  }

  // Method not allowed
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
