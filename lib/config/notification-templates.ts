export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  emailContent: string;
  notificationContent: string;
}

export const sponsorshipTemplates: NotificationTemplate[] = [
  {
    id: 'approval-enthusiastic',
    name: 'Enthusiastic Approval',
    type: 'SPONSORSHIP_APPLICATION',
    subject: 'Great News! Your Sponsorship Application for {opportunityTitle} is Approved',
    emailContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations!</h2>
        <p>Dear {sponsorName},</p>
        <p>We are thrilled to inform you that your sponsorship application for "{opportunityTitle}" has been approved!</p>
        <p>Your commitment to supporting innovation and entrepreneurship aligns perfectly with our mission, and we're excited to embark on this journey together.</p>
        <p>Our team will be reaching out shortly with detailed next steps and documentation to formalize our partnership.</p>
        <p>
          <a href="{applicationUrl}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application Details
          </a>
        </p>
        <p>If you have any immediate questions, please don't hesitate to reach out to our partnership team.</p>
        <p>Best regards,<br>The Startup Platform Team</p>
      </div>
    `,
    notificationContent: 'Congratulations! Your sponsorship application for "{opportunityTitle}" has been approved! We look forward to working with you.',
  },
  {
    id: 'approval-professional',
    name: 'Professional Approval',
    type: 'SPONSORSHIP_APPLICATION',
    subject: 'Sponsorship Application Approved - {opportunityTitle}',
    emailContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Approved</h2>
        <p>Dear {sponsorName},</p>
        <p>We are pleased to inform you that your sponsorship application for "{opportunityTitle}" has been approved.</p>
        <p>We appreciate your interest in supporting our platform and look forward to a successful partnership.</p>
        <p>You will receive further information about the next steps within the next few business days.</p>
        <p>
          <a href="{applicationUrl}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application Details
          </a>
        </p>
        <p>Best regards,<br>The Startup Platform Team</p>
      </div>
    `,
    notificationContent: 'Your sponsorship application for "{opportunityTitle}" has been approved. Check your email for details.',
  },
  {
    id: 'rejection-gentle',
    name: 'Gentle Rejection',
    type: 'SPONSORSHIP_APPLICATION',
    subject: 'Update on Your Sponsorship Application - {opportunityTitle}',
    emailContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Status Update</h2>
        <p>Dear {sponsorName},</p>
        <p>Thank you for your interest in sponsoring "{opportunityTitle}" and for the time you invested in the application process.</p>
        <p>After careful consideration, we regret to inform you that we are unable to move forward with your sponsorship application at this time.</p>
        <p>We encourage you to:</p>
        <ul>
          <li>Explore other opportunities that might be a better fit</li>
          <li>Keep an eye on future sponsorship openings</li>
          <li>Reach out if you would like feedback on your application</li>
        </ul>
        <p>
          <a href="{applicationUrl}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application Details
          </a>
        </p>
        <p>Thank you for your understanding.</p>
        <p>Best regards,<br>The Startup Platform Team</p>
      </div>
    `,
    notificationContent: 'Thank you for your interest. After review, we cannot proceed with your application for "{opportunityTitle}" at this time.',
  },
  {
    id: 'rejection-direct',
    name: 'Direct Rejection',
    type: 'SPONSORSHIP_APPLICATION',
    subject: 'Sponsorship Application Status - {opportunityTitle}',
    emailContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Status Update</h2>
        <p>Dear {sponsorName},</p>
        <p>We have completed our review of your sponsorship application for "{opportunityTitle}".</p>
        <p>Unfortunately, we are unable to accept your application at this time. This decision was made after considering various factors including our current needs and available opportunities.</p>
        <p>We appreciate your interest in our platform and encourage you to apply for future opportunities that align with your goals.</p>
        <p>
          <a href="{applicationUrl}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application Details
          </a>
        </p>
        <p>Best regards,<br>The Startup Platform Team</p>
      </div>
    `,
    notificationContent: 'Your sponsorship application for "{opportunityTitle}" was not approved. Please check your email for more information.',
  },
]; 