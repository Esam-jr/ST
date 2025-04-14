import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  
  if (!startupId) {
    return res.status(400).json({ message: 'Startup ID is required' });
  }
  
  // GET /api/startups/[id]/tasks - Fetch tasks for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to view this startup
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
            assignedToId: session.user.id
          }
        });
        hasAssignedTask = !!assignedTask;
      }
      
      // Only allow if: user is founder, admin, team member, has assigned task, or startup is accepted
      if (!isFounder && !isAdmin && !isTeamMember && !hasAssignedTask && startup.status !== 'ACCEPTED') {
        return res.status(403).json({ message: 'You do not have permission to view tasks for this startup' });
      }
      
      // Fetch tasks with assignedTo information
      const tasks = await prisma.task.findMany({
        where: { startupId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // TODO, IN_PROGRESS, BLOCKED, then COMPLETED
          { priority: 'desc' }, // HIGH, MEDIUM, LOW
          { dueDate: 'asc' }
        ],
      });
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  }
  
  // POST /api/startups/[id]/tasks - Create a new task
  if (req.method === 'POST') {
    const { title, description, dueDate, status, priority, assignedToId } = req.body;
    
    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to add tasks
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can add tasks' });
      }
      
      // Create the task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          startup: { connect: { id: startupId } },
          ...(assignedToId && { assignedTo: { connect: { id: assignedToId } } }),
        },
      });
      
      return res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ message: 'Failed to create task' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
