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
  
  // GET /api/startups/[id]/milestones - Fetch milestones for a startup
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
      const isReviewer = user?.role === 'REVIEWER';
      const isSponsor = user?.role === 'SPONSOR';
      
      // Only allow if: user is founder, admin, reviewer, sponsor, or startup is accepted
      if (!isFounder && !isAdmin && !isReviewer && !isSponsor && startup.status !== 'ACCEPTED') {
        return res.status(403).json({ message: 'You do not have permission to view milestones for this startup' });
      }
      
      // Fetch milestones
      const milestones = await prisma.milestone.findMany({
        where: { startupId },
        orderBy: [
          { status: 'asc' }, // PENDING, IN_PROGRESS first, then COMPLETED, DELAYED
          { dueDate: 'asc' }
        ],
      });
      
      return res.status(200).json(milestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return res.status(500).json({ message: 'Failed to fetch milestones' });
    }
  }
  
  // POST /api/startups/[id]/milestones - Create a new milestone
  if (req.method === 'POST') {
    const { title, description, dueDate, status } = req.body;
    
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
      
      // Check if user has permission to add milestones
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can add milestones' });
      }
      
      // Create the milestone
      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: status || 'PENDING',
          startup: { connect: { id: startupId } },
        },
      });
      
      return res.status(201).json(milestone);
    } catch (error) {
      console.error('Error creating milestone:', error);
      return res.status(500).json({ message: 'Failed to create milestone' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
