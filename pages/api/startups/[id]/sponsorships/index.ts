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
  
  // GET /api/startups/[id]/sponsorships - Fetch sponsorships for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to view financial information
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      const isSponsor = user?.role === 'SPONSOR';
      
      if (!isFounder && !isAdmin && !isSponsor) {
        return res.status(403).json({ message: 'Only the founder, admin, or sponsors can view sponsorships' });
      }
      
      // Fetch sponsorships with sponsor information
      const sponsorships = await prisma.sponsorship.findMany({
        where: { startupId },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });
      
      return res.status(200).json(sponsorships);
    } catch (error) {
      console.error('Error fetching sponsorships:', error);
      return res.status(500).json({ message: 'Failed to fetch sponsorships' });
    }
  }
  
  // POST /api/startups/[id]/sponsorships - Add a new sponsorship
  if (req.method === 'POST') {
    const { amount, notes, date } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Sponsorship amount is required' });
    }
    
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user is a sponsor
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (user?.role !== 'SPONSOR' && user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only sponsors and admins can add sponsorships' });
      }
      
      // Create the sponsorship
      const sponsorship = await prisma.sponsorship.create({
        data: {
          amount: parseFloat(amount.toString()),
          notes: notes || null,
          date: date ? new Date(date) : new Date(),
          startup: { connect: { id: startupId } },
          sponsor: { connect: { id: session.user.id } },
        },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      
      return res.status(201).json(sponsorship);
    } catch (error) {
      console.error('Error adding sponsorship:', error);
      return res.status(500).json({ message: 'Failed to add sponsorship' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
