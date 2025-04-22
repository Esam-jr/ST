import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@startupapp.com',
      ...options,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send review assignment email to a reviewer
 */
export async function sendReviewAssignmentEmail(
  reviewerEmail: string,
  reviewerName: string,
  applicationName: string,
  dueDate: Date,
  reviewLink: string
) {
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Review Assignment</h2>
      <p>Hello ${reviewerName},</p>
      <p>You have been assigned to review the application from <strong>${applicationName}</strong>.</p>
      <p>Please complete your review by <strong>${formattedDueDate}</strong>.</p>
      <p>
        <a href="${reviewLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Start Review
        </a>
      </p>
      <p>Thank you for your contribution to our review process.</p>
      <p>Best regards,<br>The Startup Platform Team</p>
    </div>
  `;

  const text = `
    New Review Assignment
    
    Hello ${reviewerName},
    
    You have been assigned to review the application from ${applicationName}.
    Please complete your review by ${formattedDueDate}.
    
    You can start your review here: ${reviewLink}
    
    Thank you for your contribution to our review process.
    
    Best regards,
    The Startup Platform Team
  `;

  return sendEmail({
    to: reviewerEmail,
    subject: `New Review Assignment: ${applicationName}`,
    html,
    text,
  });
}

/**
 * Send application status update email to an applicant
 */
export async function sendReviewStatusUpdateEmail(
  applicantEmail: string,
  applicantName: string,
  startupName: string,
  statusMessage: string,
  applicationLink: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Application Status Update</h2>
      <p>Hello ${applicantName},</p>
      <p>We have an update regarding your application for <strong>${startupName}</strong>.</p>
      <p>${statusMessage}</p>
      <p>
        <a href="${applicationLink}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Application
        </a>
      </p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Startup Platform Team</p>
    </div>
  `;

  const text = `
    Application Status Update
    
    Hello ${applicantName},
    
    We have an update regarding your application for ${startupName}.
    
    ${statusMessage}
    
    You can view your application here: ${applicationLink}
    
    If you have any questions, please don't hesitate to contact us.
    
    Best regards,
    The Startup Platform Team
  `;

  return sendEmail({
    to: applicantEmail,
    subject: `Application Status Update: ${startupName}`,
    html,
    text,
  });
} 