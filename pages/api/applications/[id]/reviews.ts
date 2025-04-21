import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get application ID from route
    const { id } = req.query;
    const applicationId = Array.isArray(id) ? id[0] : id;

    // Check if the application exists
    const application = await withPrisma(() =>
      prisma.startupCallApplication.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      })
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Get the current user's role
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    // Determine if the user has access to see the review details
    const isAdmin = user?.role === 'ADMIN';
    const isApplicant = application.userId === user?.id;
    const isReviewer = user?.role === 'REVIEWER';

    // If not admin and not the applicant, check if they're a reviewer for this application
    let isAssignedReviewer = false;
    if (isReviewer) {
      const reviewAssignment = await withPrisma(() =>
        prisma.applicationReview.findFirst({
          where: {
            applicationId,
            reviewerId: user.id,
          },
        })
      );
      isAssignedReviewer = !!reviewAssignment;
    }

    // If not authorized to view reviews, return error
    if (!isAdmin && !isApplicant && !isAssignedReviewer) {
      return res.status(403).json({ message: 'Not authorized to view reviews for this application' });
    }

    // Get all reviews for the application with reviewer information
    const reviews = await withPrisma(() =>
      prisma.applicationReview.findMany({
        where: { applicationId },
        select: {
          id: true,
          score: true,
          innovationScore: true,
          marketScore: true,
          teamScore: true,
          executionScore: true,
          feedback: true,
          status: true,
          assignedAt: true,
          dueDate: true,
          completedAt: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      })
    );

    // If user is an applicant, only return completed reviews and remove reviewer identification
    // unless the application is approved or rejected
    if (isApplicant && !['APPROVED', 'REJECTED'].includes(application.status)) {
      const filteredReviews = reviews
        .filter(review => review.status === 'COMPLETED')
        .map(review => ({
          ...review,
          reviewer: { id: 'anonymous' } // Hide reviewer identity
        }));
        
      return res.status(200).json(filteredReviews);
    }

    // Return all reviews for admins and reviewers
    return res.status(200).json(reviews);
    
  } catch (error) {
    console.error('Error fetching application reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 