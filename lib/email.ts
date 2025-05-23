import nodemailer from 'nodemailer';

// Debug: Log environment variables (remove in production)
console.log('Email Config:', {
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM,
  hasPassword: !!process.env.EMAIL_PASSWORD
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Missing required email configuration. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug output
  logger: true // Enable logger
});

// Verify the transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Configuration Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Add text as optional parameter
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text, // Include text if provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
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