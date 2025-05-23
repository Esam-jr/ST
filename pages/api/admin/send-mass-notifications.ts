import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { applicationIds, notificationType, customMessage } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: "No applications selected" });
    }

    if (!notificationType || !["INTERVIEW", "REJECTED"].includes(notificationType)) {
      return res.status(400).json({ message: "Invalid notification type" });
    }

    // Get all applications with user information
    const applications = await prisma.startupCallApplication.findMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      include: {
        user: true,
        call: true,
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
            userId: application.userId,
            type: "APPLICATION_STATUS",
            title: notificationType === "INTERVIEW" ? "Interview Invitation" : "Application Status Update",
            message: customMessage || getDefaultMessage(notificationType, application.startupName, application.call.title),
            link: `/applications/${application.id}`,
          },
        });

        // Update application status only for rejections
        if (notificationType === "REJECTED") {
          await prisma.startupCallApplication.update({
            where: { id: application.id },
            data: { status: "REJECTED" },
          });
        }

        // Send email if user has email
        if (application.user?.email) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${notificationType === "INTERVIEW" ? "Interview Invitation" : "Application Status Update"}</h2>
              <p>Hello ${application.user.name || "Applicant"},</p>
              <p>${customMessage || getDefaultMessage(notificationType, application.startupName, application.call.title)}</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/applications/${application.id}" 
                   style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                  View Application
                </a>
              </p>
              <p>Best regards,<br>The Startup Platform Team</p>
            </div>
          `;

          await sendEmail({
            to: application.user.email,
            subject: notificationType === "INTERVIEW" ? "Interview Invitation" : "Application Status Update",
            html: emailHtml,
          });
        }

        results.success++;
        results.details.push({
          applicationId: application.id,
          status: "success",
          message: "Notification sent successfully",
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          applicationId: application.id,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error sending mass notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function getDefaultMessage(notificationType: string, startupName: string, callTitle: string): string {
  if (notificationType === "INTERVIEW") {
    return `Congratulations! Your application for "${startupName}" has been selected for an interview for the "${callTitle}" call. Our team will contact you shortly to schedule the interview. Please prepare a presentation about your startup and be ready to discuss your business model, market opportunity, and growth strategy.`;
  } else {
    return `We regret to inform you that your application for "${startupName}" has not been approved for the "${callTitle}" call at this time. We encourage you to apply for future opportunities.`;
  }
} 