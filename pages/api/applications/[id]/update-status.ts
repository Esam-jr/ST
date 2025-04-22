import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { sendReviewStatusUpdateEmail } from '@/lib/email';

// Define allowed status transitions
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'MORE_INFO_REQUIRED';

const StatusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  'SUBMITTED': ['UNDER_REVIEW', 'REJECTED', 'MORE_INFO_REQUIRED'],
  'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED'],
  'APPROVED': [],
  'REJECTED': [],
  'MORE_INFO_REQUIRED': ['UNDER_REVIEW', 'REJECTED']
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session
    const session = await getServerSession(req, res, authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if the status is valid
    if (!Object.keys(StatusTransitions).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Fetch the application
    const application = await prisma.startupCallApplication.findUnique({
      where: { id: String(id) },
      include: {
        startup: true,
        user: true,
        call: true
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check permissions (only ADMIN or application owner can update)
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = session.user.id === application.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to update this application' });
    }

    // If not admin, check if the transition is allowed
    if (!isAdmin) {
      // Non-admin users might have limited permissions
      return res.status(403).json({ message: 'Only administrators can update application status' });
    }

    // Check if the status transition is allowed
    const currentStatus = application.status as ApplicationStatus;
    if (!StatusTransitions[currentStatus].includes(status as ApplicationStatus) && currentStatus !== status) {
      return res.status(400).json({ 
        message: `Cannot transition from ${currentStatus} to ${status}`,
        allowedTransitions: StatusTransitions[currentStatus]
      });
    }

    // Update the application status
    const updatedApplication = await prisma.startupCallApplication.update({
      where: { id: String(id) },
      data: { status }
    });

    // Create a notification for the applicant
    const notificationMessage = getStatusNotificationMessage(status as ApplicationStatus);
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: 'Application Status Update',
        message: notificationMessage,
        type: 'APPLICATION_STATUS',
        read: false,
        link: `/applications/${application.id}`
      }
    });

    // Send email notification if email server is configured
    if (process.env.EMAIL_SERVER_HOST && application.user?.email) {
      try {
        await sendReviewStatusUpdateEmail(
          application.user.email,
          application.user.name || 'Applicant',
          application.startupName,
          notificationMessage,
          `${process.env.NEXTAUTH_URL}/applications/${application.id}`
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue execution even if email fails
      }
    }

    return res.status(200).json({ 
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
}

// Helper function to generate notification messages based on status
function getStatusNotificationMessage(status: ApplicationStatus): string {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'Your application is now under review by our team.';
    case 'APPROVED':
      return 'Congratulations! Your application has been approved.';
    case 'REJECTED':
      return 'We regret to inform you that your application has not been approved at this time.';
    case 'MORE_INFO_REQUIRED':
      return 'We need additional information regarding your application. Please check your email for details.';
    default:
      return 'Your application status has been updated.';
  }
} 