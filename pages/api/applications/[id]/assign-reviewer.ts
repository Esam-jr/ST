import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is an admin
    const user = await withPrisma(() => 
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    );

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to assign reviewers' });
    }

    // Get application ID from route
    const { id } = req.query;
    const applicationId = Array.isArray(id) ? id[0] : id;

    // Get reviewer ID and due date from request body
    const { reviewerId, dueDate } = req.body;

    if (!reviewerId) {
      return res.status(400).json({ message: 'Reviewer ID is required' });
    }

    // Validate that the application exists
    const application = await withPrisma(() =>
      prisma.startupCallApplication.findUnique({
        where: { id: applicationId },
      })
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Validate that the reviewer exists and has REVIEWER role
    const reviewer = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, role: true, name: true, email: true }
      })
    );

    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    if (reviewer.role !== 'REVIEWER') {
      return res.status(400).json({ message: 'User is not a reviewer' });
    }

    // Check if the reviewer is already assigned to this application
    const existingAssignment = await withPrisma(() =>
      prisma.applicationReview.findFirst({
        where: {
          AND: [
            { applicationId },
            { reviewerId }
          ]
        },
      })
    );

    if (existingAssignment) {
      return res.status(400).json({ message: 'Reviewer is already assigned to this application' });
    }

    // Create the review assignment
    const dueDateValue = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default: 7 days from now
    
    const reviewAssignment = await withPrisma(() =>
      prisma.applicationReview.create({
        data: {
          reviewer: { connect: { id: reviewerId } },
          application: { connect: { id: applicationId } },
          status: 'PENDING',
          assignedAt: new Date(),
          dueDate: dueDateValue,
        },
      })
    );

    // Update the application status to UNDER_REVIEW if it's currently SUBMITTED
    if (application.status === 'SUBMITTED') {
      await withPrisma(() =>
        prisma.startupCallApplication.update({
          where: { id: applicationId },
          data: { status: 'UNDER_REVIEW' },
        })
      );
    }

    // Create notification for the reviewer
    await withPrisma(() =>
      prisma.notification.create({
        data: {
          userId: reviewerId,
          title: 'New Review Assignment',
          message: `You have been assigned to review "${application.startupName}" application.`,
          type: 'REVIEW_ASSIGNMENT',
          link: `/reviewer/applications/${applicationId}`,
        },
      })
    );

    return res.status(200).json({
      message: 'Reviewer assigned successfully',
      reviewAssignment,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
      }
    });
    
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 