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

    // Check if startup exists first
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    // Check user permissions
    const isFounder = startup.founderId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isAdmin = user?.role === 'ADMIN';

    // Determine if user is a team member
    const isTeamMember = await prisma.teamMember.findFirst({
      where: {
        startupId,
        userId: session.user.id
      }
    });

    // If user is not the founder, admin, or team member, check if they have an assigned task
    let hasAssignedTask = false;
    if (!isFounder && !isAdmin && !isTeamMember) {
      const assignedTask = await prisma.task.findFirst({
        where: {
          startupId,
          assigneeId: session.user.id
        }
      });
      hasAssignedTask = !!assignedTask;
    }

    // Only allow if: user is founder, admin, team member, has assigned task, or startup is accepted
    if (!isFounder && !isAdmin && !isTeamMember && !hasAssignedTask && startup.status !== 'ACCEPTED') {
      return res.status(403).json({ message: 'You do not have permission to view tasks for this startup' });
    }

    // GET /api/startups/[id]/tasks - Fetch tasks for a startup
    if (req.method === 'GET') {
      const tasks = await prisma.task.findMany({
        where: { startupId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          milestone: {
            select: {
              id: true,
              title: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // TODO, IN_PROGRESS, BLOCKED, then COMPLETED
          { priority: 'desc' }, // HIGH, MEDIUM, LOW
          { dueDate: 'asc' }
        ],
      });

      return res.status(200).json(tasks);
    }

    // POST /api/startups/[id]/tasks - Create a new task
    if (req.method === 'POST') {
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can add tasks' });
      }

      const { title, description, dueDate, startDate, status, priority, assignedToId, milestoneId } = req.body;

      // Validate required fields
      if (!title || !description || !dueDate || !startDate || !status || !priority) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // If milestone ID is provided, validate it
      if (milestoneId) {
        const milestone = await prisma.milestone.findFirst({
          where: {
            id: milestoneId,
            startupId
          }
        });

        if (!milestone) {
          return res.status(400).json({ message: 'Invalid milestone for this startup' });
        }
      }

      // If assignedToId is provided, validate the user
      if (assignedToId) {
        const assignedUser = await prisma.user.findUnique({
          where: { id: assignedToId }
        });

        if (!assignedUser) {
          return res.status(400).json({ message: 'Assigned user not found' });
        }
      }

      // Create the task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          startDate: new Date(startDate),
          status,
          priority,
          startup: { connect: { id: startupId } },
          ...(assignedToId && { assignee: { connect: { id: assignedToId } } }),
          ...(milestoneId && { milestone: { connect: { id: milestoneId } } }),
          creator: { connect: { id: session.user.id } },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          milestone: {
            select: {
              id: true,
              title: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      return res.status(201).json(task);
    }

    // PATCH /api/startups/[id]/tasks - Update task status
    if (req.method === 'PATCH') {
      const { taskId, status } = req.body;

      if (!taskId || !status) {
        return res.status(400).json({ message: 'Task ID and status are required' });
      }

      // Validate status
      const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Check if task exists and belongs to the startup
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          startupId,
        },
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Update task status
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          ...(status === 'COMPLETED' && { completedDate: new Date() }),
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          milestone: {
            select: {
              id: true,
              title: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      return res.status(200).json(updatedTask);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in tasks API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
