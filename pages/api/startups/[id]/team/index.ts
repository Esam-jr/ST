import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use getServerSession for authentication
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
      
      // Check if user has permission to view this startup's team
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
      
      // Only allow if: user is founder, admin, team member, or startup is accepted
      if (!isFounder && !isAdmin && !isTeamMember && startup.status !== 'ACCEPTED') {
        return res.status(403).json({ message: 'You do not have permission to view the team for this startup' });
      }
      
      // Get all team members including the founder
      const teamMembers = await prisma.teamMember.findMany({
        where: { startupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
      
      // Also get the founder information
      const founder = await prisma.user.findUnique({
        where: { id: startup.founderId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
      
      // Collect unique team members (avoiding duplicates)
      const allTeamMembers = [
        ...(founder ? [founder] : []),
        ...teamMembers.map(member => member.user)
      ];
      
      // Remove duplicates (in case founder is also in team members)
      const uniqueTeamMembers = Array.from(
        new Map(allTeamMembers.map(member => [member.id, member])).values()
      );
      
      // For admins, also include other relevant admins
      if (isAdmin) {
        const otherAdmins = await prisma.user.findMany({
          where: {
            role: 'ADMIN',
            id: { not: session.user.id },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
        
        // Add admins to the team members list (avoiding duplicates)
        otherAdmins.forEach(admin => {
          if (!uniqueTeamMembers.some(member => member.id === admin.id)) {
            uniqueTeamMembers.push(admin);
          }
        });
      }
      
      return res.status(200).json(uniqueTeamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch team members',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
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
  
  // Method not allowed for other methods
  return res.status(405).json({ message: 'Method not allowed' });
}
