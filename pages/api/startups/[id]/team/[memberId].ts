import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id, memberId } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  const mId = Array.isArray(memberId) ? memberId[0] : memberId;
  
  if (!startupId || !mId) {
    return res.status(400).json({ message: 'Startup ID and Member ID are required' });
  }
  
  try {
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    
    // Check if team member exists and belongs to the startup
    const teamMember = await prisma.teamMember.findFirst({
      where: { 
        id: mId,
        startupId,
      },
    });
    
    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Check if user has permission to manage team members
    const isFounder = startup.founderId === session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isFounder && !isAdmin) {
      return res.status(403).json({ message: 'Only the founder or admin can manage team members' });
    }
    
    // Handle different methods
    
    // GET /api/startups/[id]/team/[memberId] - Get a specific team member
    if (req.method === 'GET') {
      return res.status(200).json(teamMember);
    }
    
    // PUT /api/startups/[id]/team/[memberId] - Update a team member
    if (req.method === 'PUT') {
      const { name, email, role, bio } = req.body;
      
      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required' });
      }
      
      const updatedTeamMember = await prisma.teamMember.update({
        where: { id: mId },
        data: {
          name,
          email,
          role,
          bio: bio || null,
        },
      });
      
      return res.status(200).json(updatedTeamMember);
    }
    
    // DELETE /api/startups/[id]/team/[memberId] - Remove a team member
    if (req.method === 'DELETE') {
      // Don't allow removing the founder
      if (teamMember.userId === startup.founderId) {
        return res.status(400).json({ message: 'Cannot remove the founder from the team' });
      }
      
      await prisma.teamMember.delete({
        where: { id: mId },
      });
      
      return res.status(200).json({ message: 'Team member removed successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Error handling team member ${req.method} request:`, error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}
