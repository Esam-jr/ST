import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate status
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find the startup associated with the user
    const startup = await prisma.startup.findFirst({
      where: {
        founderId: session.user.id,
      },
      include: {
        milestones: {
          where: {
            id: id as string,
          },
        },
      },
    });

    if (!startup) {
      return res.status(404).json({ message: "Startup not found" });
    }

    // Check if the milestone belongs to the startup
    if (!startup.milestones.length) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    // Update the milestone
    const updatedMilestone = await prisma.milestone.update({
      where: {
        id: id as string,
      },
      data: {
        status,
      },
    });

    return res.status(200).json(updatedMilestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 