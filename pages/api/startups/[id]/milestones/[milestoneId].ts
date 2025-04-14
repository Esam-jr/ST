import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id, milestoneId } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  const mId = Array.isArray(milestoneId) ? milestoneId[0] : milestoneId;
  
  if (!startupId || !mId) {
    return res.status(400).json({ message: 'Startup ID and Milestone ID are required' });
  }
  
  try {
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    
    // Check if milestone exists and belongs to the startup
    const milestone = await prisma.milestone.findFirst({
      where: { 
        id: mId,
        startupId,
      },
    });
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Check if user has permission to manage milestones
    const isFounder = startup.founderId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isFounder && !isAdmin) {
      return res.status(403).json({ message: 'Only the founder or admin can manage milestones' });
    }
    
    // Handle different methods
    
    // GET /api/startups/[id]/milestones/[milestoneId] - Get a specific milestone
    if (req.method === 'GET') {
      return res.status(200).json(milestone);
    }
    
    // PUT /api/startups/[id]/milestones/[milestoneId] - Update a milestone
    if (req.method === 'PUT') {
      const { title, description, dueDate, status } = req.body;
      
      if (!title || !description || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const updatedMilestone = await prisma.milestone.update({
        where: { id: mId },
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: status || milestone.status,
        },
      });
      
      return res.status(200).json(updatedMilestone);
    }
    
    // PATCH /api/startups/[id]/milestones/[milestoneId] - Update milestone status
    if (req.method === 'PATCH') {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedMilestone = await prisma.milestone.update({
        where: { id: mId },
        data: { status },
      });
      
      return res.status(200).json(updatedMilestone);
    }
    
    // DELETE /api/startups/[id]/milestones/[milestoneId] - Delete a milestone
    if (req.method === 'DELETE') {
      await prisma.milestone.delete({
        where: { id: mId },
      });
      
      return res.status(200).json({ message: 'Milestone deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Error handling milestone ${req.method} request:`, error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}
