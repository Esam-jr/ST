import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      return res.status(403).json({ message: 'Only reviewers can access review assignments' });
    }

    // Get assignment ID from route
    const { id } = req.query;
    const assignmentId = Array.isArray(id) ? id[0] : id;

    // Fetch the review assignment using raw SQL to avoid schema issues
    const query = `
      SELECT ar.*, a.id as "applicationId"
      FROM "ApplicationReview" ar
      JOIN "StartupCallApplication" a ON ar."applicationId" = a.id
      WHERE ar.id = $1 AND ar."reviewerId" = $2
    `;

    const reviewAssignments = await withPrisma(() =>
      prisma.$queryRawUnsafe(query, assignmentId, user.id)
    ) as any[];

    if (!reviewAssignments || reviewAssignments.length === 0) {
      return res.status(404).json({ message: 'Review assignment not found' });
    }

    const reviewAssignment = reviewAssignments[0];

    // Send the review assignment with the applicationId
    return res.status(200).json({
      id: reviewAssignment.id,
      applicationId: reviewAssignment.applicationId,
      status: reviewAssignment.status,
      assignedAt: reviewAssignment.assignedAt,
      dueDate: reviewAssignment.dueDate,
      completedAt: reviewAssignment.completedAt,
      score: reviewAssignment.score,
      innovationScore: reviewAssignment.innovationScore,
      marketScore: reviewAssignment.marketScore,
      teamScore: reviewAssignment.teamScore,
      executionScore: reviewAssignment.executionScore,
      feedback: reviewAssignment.feedback,
    });
    
  } catch (error) {
    console.error('Error fetching review assignment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 