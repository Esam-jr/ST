import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { id } = req.query;
    const startupId = Array.isArray(id) ? id[0] : id;
    
    if (!startupId) {
      return res.status(400).json({ message: 'Startup ID is required' });
    }

    // Check if startup exists and user has permission
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    // Only allow founder to manage milestones
    if (startup.founderId !== session.user.id) {
      return res.status(403).json({ message: 'Only the founder can manage milestones' });
    }

    // GET /api/startups/[id]/milestones - Fetch milestones for a startup
    if (req.method === 'GET') {
      const milestones = await prisma.milestone.findMany({
        where: { startupId },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' }
        ],
      });

      return res.status(200).json(milestones);
    }

    // POST /api/startups/[id]/milestones - Create a new milestone
    if (req.method === 'POST') {
      const { title, description, dueDate } = req.body;

      // Validate required fields
      if (!title || !description || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create the milestone
      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: 'PENDING',
          startup: { connect: { id: startupId } },
        },
      });

      return res.status(201).json(milestone);
    }

    // PATCH /api/startups/[id]/milestones - Update milestone status
    if (req.method === 'PATCH') {
      const { milestoneId, status } = req.body;

      if (!milestoneId || !status) {
        return res.status(400).json({ message: 'Milestone ID and status are required' });
      }

      // Validate status
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Check if milestone exists and belongs to the startup
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          startupId,
        },
      });

      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      // Update the milestone status
      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status },
      });

      return res.status(200).json(updatedMilestone);
    }

    // DELETE /api/startups/[id]/milestones - Delete milestone
    if (req.method === 'DELETE') {
      const { milestoneId } = req.body;

      if (!milestoneId) {
        return res.status(400).json({ message: 'Milestone ID is required' });
      }

      // Check if milestone exists and belongs to the startup
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          startupId,
        },
      });

      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      // Delete the milestone
      await prisma.milestone.delete({
        where: { id: milestoneId },
      });

      return res.status(200).json({ message: 'Milestone deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in milestones API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
