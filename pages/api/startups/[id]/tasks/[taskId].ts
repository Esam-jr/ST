import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id, taskId } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  const tId = Array.isArray(taskId) ? taskId[0] : taskId;
  
  if (!startupId || !tId) {
    return res.status(400).json({ message: 'Startup ID and Task ID are required' });
  }
  
  try {
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    
    // Check if task exists and belongs to the startup
    const task = await prisma.task.findFirst({
      where: { 
        id: tId,
        startupId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check user permissions
    const isFounder = startup.founderId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isAdmin = user?.role === 'ADMIN';
    const isAssignedToUser = task.assignedToId === session.user.id;
    
    // GET /api/startups/[id]/tasks/[taskId] - Get a specific task
    if (req.method === 'GET') {
      return res.status(200).json(task);
    }
    
    // PUT /api/startups/[id]/tasks/[taskId] - Update a task (full update)
    if (req.method === 'PUT') {
      // Only founder or admin can do a full update
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can update tasks' });
      }
      
      const { title, description, dueDate, status, priority, assignedToId } = req.body;
      
      if (!title || !description || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const updatedTask = await prisma.task.update({
        where: { id: tId },
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: status || task.status,
          priority: priority || task.priority,
          ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      
      return res.status(200).json(updatedTask);
    }
    
    // PATCH /api/startups/[id]/tasks/[taskId] - Update task status (partial update)
    if (req.method === 'PATCH') {
      // For status updates, allow assigned users to update their tasks
      if (!isFounder && !isAdmin && !isAssignedToUser) {
        return res.status(403).json({ message: 'You do not have permission to update this task' });
      }
      
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      if (!['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedTask = await prisma.task.update({
        where: { id: tId },
        data: { status },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      
      return res.status(200).json(updatedTask);
    }
    
    // DELETE /api/startups/[id]/tasks/[taskId] - Delete a task
    if (req.method === 'DELETE') {
      // Only founder or admin can delete tasks
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can delete tasks' });
      }
      
      await prisma.task.delete({
        where: { id: tId },
      });
      
      return res.status(200).json({ message: 'Task deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Error handling task ${req.method} request:`, error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}
