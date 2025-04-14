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
  
  // GET /api/startups/[id]/expenses - Fetch expenses for a startup
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
        return res.status(403).json({ message: 'Only the founder, admin, or sponsors can view expenses' });
      }
      
      // Fetch expenses
      const expenses = await prisma.expense.findMany({
        where: { startupId },
        orderBy: { date: 'desc' },
      });
      
      return res.status(200).json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  }
  
  // POST /api/startups/[id]/expenses - Add a new expense
  if (req.method === 'POST') {
    const { amount, category, description, date } = req.body;
    
    if (!amount || !category || !description) {
      return res.status(400).json({ message: 'Amount, category, and description are required' });
    }
    
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to add expenses
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      
      if (!isFounder && !isAdmin) {
        return res.status(403).json({ message: 'Only the founder or admin can add expenses' });
      }
      
      // Create the expense
      const expense = await prisma.expense.create({
        data: {
          amount: parseFloat(amount.toString()),
          category,
          description,
          date: date ? new Date(date) : new Date(),
          startup: { connect: { id: startupId } },
        },
      });
      
      return res.status(201).json(expense);
    } catch (error) {
      console.error('Error adding expense:', error);
      return res.status(500).json({ message: 'Failed to add expense' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
