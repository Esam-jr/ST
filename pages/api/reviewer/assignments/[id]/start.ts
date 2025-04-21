import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is a reviewer
    const user = await withPrisma(() => 
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    );

    if (!user || user.role !== 'REVIEWER') {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }

    // Get assignment ID from route
    const { id } = req.query;
    const assignmentId = Array.isArray(id) ? id[0] : id;

    // Check if the assignment exists and belongs to the reviewer
    const assignment = await withPrisma(() => 
      prisma.applicationReview.findFirst({
        where: {
          id: assignmentId,
          reviewerId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          application: {
            select: {
              id: true,
              startupName: true,
            }
          }
        }
      })
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Review assignment not found or not assigned to you' });
    }

    // Check if the review is already completed
    if (assignment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'This review is already completed' });
    }

    // Update the assignment status to IN_PROGRESS
    const updatedAssignment = await withPrisma(() => 
      prisma.applicationReview.update({
        where: { id: assignmentId },
        data: { status: 'IN_PROGRESS' },
        select: {
          id: true,
          status: true,
          assignedAt: true,
          dueDate: true,
          application: {
            select: {
              id: true,
              startupName: true,
            }
          }
        }
      })
    );

    return res.status(200).json({
      message: 'Review started successfully',
      assignment: updatedAssignment
    });
    
  } catch (error) {
    console.error('Error starting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 