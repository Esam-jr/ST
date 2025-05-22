import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use getServerSession instead of getSession for more reliable authentication
  const session = await getServerSession(req, res, authOptions);
  
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
      
      // Fetch milestones with related tasks information
      const milestones = await prisma.milestone.findMany({
        where: { startupId },
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING, IN_PROGRESS first, then COMPLETED, DELAYED
          { dueDate: 'asc' }
        ],
      });
      
      // Calculate progress for each milestone based on tasks
      const milestonesWithProgress = milestones.map(milestone => {
        const totalTasks = milestone.tasks.length;
        const completedTasks = milestone.tasks.filter(task => task.status === 'COMPLETED').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          ...milestone,
          progressPercentage,
          tasksCount: totalTasks,
          completedTasksCount: completedTasks
        };
      });
      
      return res.status(200).json(milestonesWithProgress);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch milestones',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  }
  
  // POST /api/startups/[id]/milestones - Create a new milestone
  if (req.method === 'POST') {
    const { title, description, dueDate, status } = req.body;
    
    // Validate required fields
    if (!title || !description || !dueDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'Title, description, and dueDate are required'
      });
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
      
      // Validate date
      const parsedDueDate = new Date(dueDate);
      const today = new Date();
      
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }
      
      // Optional: Validation if due date is in the past
      if (parsedDueDate < today) {
        // Could return an error, but might be valid for historical milestones
        // Instead, we'll just warn in the response
        console.warn(`Milestone created with past due date: ${parsedDueDate.toISOString()}`);
      }
      
      // Check for milestone title uniqueness within the startup
      const existingMilestone = await prisma.milestone.findFirst({
        where: {
          startupId,
          title: {
            equals: title,
            mode: 'insensitive' // Case insensitive
          }
        }
      });
      
      if (existingMilestone) {
        return res.status(409).json({ 
          message: 'A milestone with this title already exists for this startup',
          existingMilestoneId: existingMilestone.id
        });
      }
      
      // Create the milestone
      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          dueDate: parsedDueDate,
          status: status || 'PENDING',
          startup: { connect: { id: startupId } },
        },
        include: {
          tasks: true
        }
      });
      
      // Add progress information
      const milestoneWithProgress = {
        ...milestone,
        progressPercentage: 0,
        tasksCount: 0,
        completedTasksCount: 0
      };
      
      return res.status(201).json(milestoneWithProgress);
    } catch (error) {
      console.error('Error creating milestone:', error);
      return res.status(500).json({ 
        message: 'Failed to create milestone',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
