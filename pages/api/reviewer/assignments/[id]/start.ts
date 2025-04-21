import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user is a reviewer
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    if (!user || user.role !== 'REVIEWER') {
      return res.status(403).json({ message: 'Only reviewers can start reviews' });
    }

    // Get assignment ID from route
    const { id } = req.query;
    const assignmentId = Array.isArray(id) ? id[0] : id;

    // Check if the review assignment exists and belongs to this reviewer
    const reviewAssignment = await withPrisma(() =>
      prisma.$queryRaw`
        SELECT id, status FROM "ApplicationReview"
        WHERE id = ${assignmentId} AND "reviewerId" = ${user.id}
      `
    ) as any[];

    if (!reviewAssignment || reviewAssignment.length === 0) {
      return res.status(404).json({ message: 'Review assignment not found' });
    }

    // Check if the review is already completed
    if (reviewAssignment[0].status === 'COMPLETED') {
      return res.status(400).json({ message: 'This review has already been completed' });
    }

    // Update the review status to IN_PROGRESS
    const updatedReview = await withPrisma(() =>
      prisma.$queryRaw`
        UPDATE "ApplicationReview"
        SET status = 'IN_PROGRESS'
        WHERE id = ${assignmentId}
        RETURNING id, status
      `
    ) as any[];

    return res.status(200).json({
      message: 'Review started successfully',
      review: updatedReview[0]
    });
    
  } catch (error) {
    console.error('Error starting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 