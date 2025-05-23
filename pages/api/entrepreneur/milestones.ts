import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // GET /api/entrepreneur/milestones - List milestones
    if (req.method === 'GET') {
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
        include: {
          milestones: true,
        },
      });

      if (!startup) {
        return res.status(404).json({ message: 'No startup found for this user' });
      }

      return res.status(200).json(startup.milestones);
    }

    // POST /api/entrepreneur/milestones - Create milestone
    if (req.method === 'POST') {
      const { title, description, dueDate } = req.body;

      if (!title || !description || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
      });

      if (!startup) {
        return res.status(404).json({ message: 'No startup found for this user' });
      }

      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: 'PENDING',
          startup: { connect: { id: startup.id } },
        },
      });

      return res.status(201).json(milestone);
    }

    // PATCH /api/entrepreneur/milestones/:id - Update milestone status
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Verify ownership
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
        include: {
          milestones: true,
        },
      });

      if (!startup) {
        return res.status(404).json({ message: 'No startup found for this user' });
      }

      const milestone = startup.milestones.find(m => m.id === id);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      const updatedMilestone = await prisma.milestone.update({
        where: { id: id as string },
        data: { status },
      });

      return res.status(200).json(updatedMilestone);
    }

    // DELETE /api/entrepreneur/milestones/:id - Delete milestone
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'Missing milestone ID' });
      }

      // Verify ownership
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
        include: {
          milestones: true,
        },
      });

      if (!startup) {
        return res.status(404).json({ message: 'No startup found for this user' });
      }

      const milestone = startup.milestones.find(m => m.id === id);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      await prisma.milestone.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ message: 'Milestone deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in milestones API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
