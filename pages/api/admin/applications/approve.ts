import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { StartupCallApplicationStatus } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    // Find the application
    const application = await prisma.startupCallApplication.findUnique({
      where: { id: applicationId },
      include: {
        call: true,
        startup: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update application status to APPROVED
    const updatedApplication = await prisma.startupCallApplication.update({
      where: { id: applicationId },
      data: { status: StartupCallApplicationStatus.APPROVED },
    });

    // Check if there's already a budget for this startup call
    const existingBudget = await prisma.budget.findFirst({
      where: {
        startupCallId: application.callId,
      },
    });

    // If a budget exists, link it to the startup via the application
    if (existingBudget) {
      // For now, we just use the existing budget
      // In a future enhancement, we could create startup-specific budget allocations
      console.log(
        `Budget ${existingBudget.id} auto-linked to approved application ${applicationId}`
      );
    } else {
      // Create a default budget if none exists
      const newBudget = await prisma.budget.create({
        data: {
          startupCallId: application.callId,
          title: `Budget for ${application.call.title}`,
          description: `Auto-generated budget for the approved startup: ${
            application.startup?.name || "Unknown"
          }`,
          totalAmount: 10000, // Default amount, should be configurable
          currency: "USD",
          fiscalYear: new Date().getFullYear().toString(),
          status: "active",
        },
      });

      // Create default budget categories
      await prisma.budgetCategory.createMany({
        data: [
          {
            budgetId: newBudget.id,
            name: "Operations",
            description: "Day-to-day operational expenses",
            allocatedAmount: 4000,
          },
          {
            budgetId: newBudget.id,
            name: "Marketing",
            description: "Marketing and promotion expenses",
            allocatedAmount: 3000,
          },
          {
            budgetId: newBudget.id,
            name: "Development",
            description: "Product/service development",
            allocatedAmount: 2000,
          },
          {
            budgetId: newBudget.id,
            name: "Miscellaneous",
            description: "Other expenses",
            allocatedAmount: 1000,
          },
        ],
      });

      console.log(
        `New budget ${newBudget.id} created and linked to approved application ${applicationId}`
      );
    }

    return res.status(200).json({
      message: "Application approved and budget assigned successfully",
      data: updatedApplication,
    });
  } catch (error) {
    console.error("Error approving application:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
