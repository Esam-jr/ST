import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

    // Get application ID from route
    const { id } = req.query;
    const applicationId = Array.isArray(id) ? id[0] : id;

    // Get review data from request body
    const { score, innovationScore, marketScore, teamScore, executionScore, feedback } = req.body;

    // Validate required fields
    if (!score || !feedback) {
      return res.status(400).json({ message: 'Score and feedback are required' });
    }

    // Validate score range (0-100)
    if (score < 0 || score > 100 || 
        (innovationScore !== undefined && (innovationScore < 0 || innovationScore > 100)) ||
        (marketScore !== undefined && (marketScore < 0 || marketScore > 100)) ||
        (teamScore !== undefined && (teamScore < 0 || teamScore > 100)) ||
        (executionScore !== undefined && (executionScore < 0 || executionScore > 100))) {
      return res.status(400).json({ message: 'Scores must be between 0 and 100' });
    }

    // Check if the user is a reviewer
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    if (!user || user.role !== 'REVIEWER') {
      return res.status(403).json({ message: 'Only reviewers can submit reviews' });
    }

    // Check if the application exists
    const application = await withPrisma(() =>
      prisma.startupCallApplication.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          startupName: true,
          userId: true,
          reviewsCompleted: true,
          reviewsTotal: true,
          status: true,
        },
      })
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the reviewer is assigned to this application
    const reviewAssignment = await withPrisma(() =>
      prisma.applicationReview.findFirst({
        where: {
          applicationId,
          reviewerId: user.id,
        },
      })
    );

    if (!reviewAssignment) {
      return res.status(403).json({ message: 'You are not assigned to review this application' });
    }

    if (reviewAssignment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'You have already submitted a review for this application' });
    }

    // Update the review with the submitted data
    const updatedReview = await withPrisma(() =>
      prisma.applicationReview.update({
        where: { id: reviewAssignment.id },
        data: {
          score,
          innovationScore,
          marketScore,
          teamScore,
          executionScore,
          feedback,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    );

    // Increment the reviewsCompleted count for the application
    const updatedApplication = await withPrisma(() =>
      prisma.startupCallApplication.update({
        where: { id: applicationId },
        data: {
          reviewsCompleted: application.reviewsCompleted + 1,
        },
        select: {
          id: true,
          reviewsCompleted: true,
          reviewsTotal: true,
          status: true,
        },
      })
    );

    // Create notification for the applicant
    await withPrisma(() =>
      prisma.notification.create({
        data: {
          userId: application.userId,
          title: 'Application Review Update',
          message: `A review has been submitted for your "${application.startupName}" application.`,
          type: 'REVIEW_SUBMISSION',
          link: `/applications/${applicationId}`,
        },
      })
    );

    // Create notification for admin if all reviews are completed
    if (updatedApplication.reviewsCompleted >= updatedApplication.reviewsTotal) {
      // Find admins
      const admins = await withPrisma(() =>
        prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        })
      );

      // Notify all admins
      for (const admin of admins) {
        await withPrisma(() =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'All Reviews Completed',
              message: `All reviews have been completed for the "${application.startupName}" application.`,
              type: 'ALL_REVIEWS_COMPLETED',
              link: `/admin/startup-calls/applications/${applicationId}`,
            },
          })
        );
      }
    }

    return res.status(200).json({
      message: 'Review submitted successfully',
      review: updatedReview,
      application: updatedApplication,
    });
    
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 