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
  
  // GET /api/startups/[id]/reviews - Fetch reviews for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Fetch reviews with reviewer information
      const reviews = await prisma.review.findMany({
        where: { startupId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  }
  
  // POST /api/startups/[id]/reviews - Create a new review
  if (req.method === 'POST') {
    const { score, innovationScore, marketScore, teamScore, executionScore, feedback } = req.body;
    
    if (!score || !feedback || !innovationScore || !marketScore || !teamScore || !executionScore) {
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
      
      // Check if user is a reviewer or admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (user?.role !== 'REVIEWER' && user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only reviewers and admins can add reviews' });
      }
      
      // Check if user has already reviewed this startup
      const existingReview = await prisma.review.findFirst({
        where: {
          startupId,
          reviewerId: session.user.id,
        },
      });
      
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this startup' });
      }
      
      // Create the review
      const review = await prisma.review.create({
        data: {
          score,
          innovationScore,
          marketScore,
          teamScore,
          executionScore,
          feedback,
          startup: { connect: { id: startupId } },
          reviewer: { connect: { id: session.user.id } },
        },
      });
      
      // Update startup status to UNDER_REVIEW if it's in SUBMITTED state
      if (startup.status === 'SUBMITTED') {
        await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'UNDER_REVIEW' },
        });
      }
      
      return res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ message: 'Failed to create review' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
