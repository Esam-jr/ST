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
  
  // GET /api/startups/[id]/team - Fetch team members for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Fetch team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { startupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      
      // Transform the data to simplify the response
      const formattedTeamMembers = teamMembers.map(member => ({
        id: member.id,
        name: member.name || member.user?.name,
        email: member.email,
        role: member.role,
        bio: member.bio,
        userId: member.userId,
        image: member.user?.image,
        startupId: member.startupId,
        createdAt: member.createdAt,
      }));
      
      return res.status(200).json(formattedTeamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      return res.status(500).json({ message: 'Failed to fetch team members' });
    }
  }
  
  // POST /api/startups/[id]/team - Add a new team member
  if (req.method === 'POST') {
    const { name, email, role, bio, userId } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }
    
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to add team members
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can add team members' });
      }
      
      // Check if a team member with this email already exists
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          startupId,
          email,
        },
      });
      
      if (existingMember) {
        return res.status(400).json({ message: 'A team member with this email already exists' });
      }
      
      // If userId is provided, check if the user exists
      let userToLink = null;
      if (userId) {
        userToLink = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!userToLink) {
          return res.status(404).json({ message: 'User not found' });
        }
      } else {
        // Try to find a user with the provided email
        userToLink = await prisma.user.findUnique({
          where: { email },
        });
      }
      
      // Create the team member
      const teamMember = await prisma.teamMember.create({
        data: {
          name,
          email,
          role,
          bio: bio || null,
          startup: { connect: { id: startupId } },
          ...(userToLink && { user: { connect: { id: userToLink.id } } }),
        },
      });
      
      return res.status(201).json(teamMember);
    } catch (error) {
      console.error('Error adding team member:', error);
      return res.status(500).json({ message: 'Failed to add team member' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
