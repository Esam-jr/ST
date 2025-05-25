import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { applicationIds, notificationType, customTemplate } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'No applications selected' });
    }

    if (!notificationType || !['APPROVED', 'REJECTED'].includes(notificationType)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Get all applications with sponsor and opportunity information
    const applications = await prisma.sponsorshipApplication.findMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      include: {
        sponsor: {
          select: {
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            title: true,
          },
        },
      },
    });

    const results = {
      total: applications.length,
      success: 0,
      failed: 0,
      details: [] as any[],
    };

    // Process each application
    for (const application of applications) {
      try {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: application.sponsorId,
            type: 'SPONSORSHIP_APPLICATION_STATUS',
            title: notificationType === 'APPROVED' ? 'Sponsorship Application Approved' : 'Sponsorship Application Update',
            message: customTemplate?.notificationContent 
              ? replaceVariables(customTemplate.notificationContent, {
                  sponsorName: application.sponsor?.name || 'Sponsor',
                  opportunityTitle: application.opportunity.title,
                })
              : getNotificationMessage(notificationType, application.opportunity.title),
            link: `/sponsor/applications/${application.id}`,
          },
        });

        // Update application status
        await prisma.sponsorshipApplication.update({
          where: { id: application.id },
          data: { status: notificationType },
        });

        // Send email if sponsor has email
        if (application.sponsor?.email) {
          const emailHtml = customTemplate?.emailContent
            ? replaceVariables(customTemplate.emailContent, {
                sponsorName: application.sponsor.name || 'Sponsor',
                opportunityTitle: application.opportunity.title,
                applicationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sponsor/applications/${application.id}`,
              })
            : getEmailTemplate(
                notificationType,
                application.sponsor.name || 'Sponsor',
                application.opportunity.title,
                application.id
              );

          await sendEmail({
            to: application.sponsor.email,
            subject: customTemplate?.subject 
              ? replaceVariables(customTemplate.subject, {
                  opportunityTitle: application.opportunity.title,
                })
              : getEmailSubject(notificationType, application.opportunity.title),
            html: emailHtml,
          });
        }

        results.success++;
        results.details.push({
          applicationId: application.id,
          status: 'success',
          message: 'Notification sent successfully',
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          applicationId: application.id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error sending notifications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function replaceVariables(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    return result.replace(regex, value);
  }, template);
}

function getNotificationMessage(type: string, opportunityTitle: string): string {
  if (type === 'APPROVED') {
    return `Your sponsorship application for "${opportunityTitle}" has been approved! We'll be in touch with next steps.`;
  }
  return `We've reviewed your sponsorship application for "${opportunityTitle}". Unfortunately, we cannot proceed with your application at this time.`;
}

function getEmailSubject(type: string, opportunityTitle: string): string {
  return type === 'APPROVED'
    ? `Sponsorship Application Approved - ${opportunityTitle}`
    : `Sponsorship Application Status Update - ${opportunityTitle}`;
}

function getEmailTemplate(
  type: string,
  sponsorName: string,
  opportunityTitle: string,
  applicationId: string
): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const viewApplicationUrl = `${baseUrl}/sponsor/applications/${applicationId}`;

  if (type === 'APPROVED') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sponsorship Application Approved!</h2>
        <p>Dear ${sponsorName},</p>
        <p>We are pleased to inform you that your sponsorship application for "${opportunityTitle}" has been approved!</p>
        <p>We are excited to have you as a sponsor and look forward to working together. Our team will be in touch shortly with more details about the next steps and how to proceed with the sponsorship.</p>
        <p>
          <a href="${viewApplicationUrl}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application Details
          </a>
        </p>
        <p>If you have any questions in the meantime, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The Startup Platform Team</p>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Sponsorship Application Status Update</h2>
      <p>Dear ${sponsorName},</p>
      <p>Thank you for your interest in sponsoring "${opportunityTitle}". We have carefully reviewed your application.</p>
      <p>Unfortunately, after careful consideration, we regret to inform you that we cannot proceed with your sponsorship application at this time.</p>
      <p>This decision was made after a thorough review process, taking into account various factors including our current needs and available opportunities.</p>
      <p>We encourage you to:</p>
      <ul>
        <li>Review other sponsorship opportunities that might be a better fit</li>
        <li>Consider applying for future opportunities that align with your goals</li>
        <li>Reach out to our support team if you would like feedback on your application</li>
      </ul>
      <p>
        <a href="${viewApplicationUrl}" 
           style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Application Details
        </a>
      </p>
      <p>Thank you for your understanding and continued interest in our platform.</p>
      <p>Best regards,<br>The Startup Platform Team</p>
    </div>
  `;
} 