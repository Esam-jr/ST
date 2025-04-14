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
  
  // GET /api/startups/[id]/comments - Fetch comments for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Fetch comments with author information
      const comments = await prisma.comment.findMany({
        where: { startupId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ message: 'Failed to fetch comments' });
    }
  }
  
  // POST /api/startups/[id]/comments - Add a new comment
  if (req.method === 'POST') {
    const { content, parentId } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // If parentId is provided, check if parent comment exists
      if (parentId) {
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: parentId,
            startupId,
          },
        });
        
        if (!parentComment) {
          return res.status(404).json({ message: 'Parent comment not found' });
        }
      }
      
      // Create the comment
      const comment = await prisma.comment.create({
        data: {
          content,
          parentId: parentId || null,
          startup: { connect: { id: startupId } },
          author: { connect: { id: session.user.id } },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      
      return res.status(201).json(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({ message: 'Failed to add comment' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
