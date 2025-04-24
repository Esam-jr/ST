import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PUT requests for this endpoint
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user is an admin
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get application data from request body
    const { applicationId, status, feedbackMessage } = req.body;

    // Validate required fields
    if (!applicationId || !status) {
      return res.status(400).json({ message: 'Application ID and status are required' });
    }

    // Validate status values
    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SUBMITTED', 'WITHDRAWN'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if the application exists
    const application = await withPrisma(() =>
      prisma.startupCallApplication.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          startupName: true,
          userId: true,
          status: true,
          callId: true,
          call: {
            select: {
              title: true
            }
          }
        }
      })
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update the application status
    const updatedApplication = await withPrisma(() =>
      prisma.startupCallApplication.update({
        where: { id: applicationId },
        data: { status },
        select: {
          id: true,
          startupName: true,
          userId: true,
          status: true
        }
      })
    );

    // Create a notification for the applicant
    let notificationTitle = 'Application Status Update';
    let notificationMessage = `Your application "${application.startupName}" for "${application.call.title}" has been updated to ${status.toLowerCase()}.`;
    
    if (status === 'APPROVED') {
      notificationTitle = 'Application Approved!';
      notificationMessage = `Congratulations! Your application "${application.startupName}" for "${application.call.title}" has been approved.`;
      
      if (feedbackMessage) {
        notificationMessage += ` Feedback: ${feedbackMessage}`;
      }
    } else if (status === 'REJECTED') {
      notificationTitle = 'Application Not Selected';
      notificationMessage = `We regret to inform you that your application "${application.startupName}" for "${application.call.title}" has not been selected.`;
      
      if (feedbackMessage) {
        notificationMessage += ` Feedback: ${feedbackMessage}`;
      }
    }

    await withPrisma(() =>
      prisma.notification.create({
        data: {
          userId: application.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'APPLICATION_STATUS',
          link: `/applications/${applicationId}`,
        }
      })
    );

    return res.status(200).json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
    
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 