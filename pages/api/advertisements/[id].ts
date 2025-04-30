import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  
  // Check if user has admin role
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  const { id } = req.query;
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // Check if advertisement exists
      const existingAd = await prisma.advertisement.findUnique({
        where: { id: String(id) },
      });
      
      if (!existingAd) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }
      
      // Delete advertisement
      await prisma.advertisement.delete({
        where: { id: String(id) },
      });
      
      // Return success response
      return res.status(200).json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      return res.status(500).json({ error: 'Failed to delete advertisement' });
    }
  }
  
  // Return method not allowed for other HTTP methods
  return res.status(405).json({ error: 'Method not allowed' });
} 