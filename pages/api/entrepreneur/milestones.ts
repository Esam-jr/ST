import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get session
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.role !== "ENTREPRENEUR") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get startup
  const startup = await prisma.startup.findFirst({
    where: {
      founderId: session.user.id,
    },
  });

  if (!startup) {
    return res.status(404).json({ message: "No startup found for this user" });
  }

  // Handle GET request - list milestones
  if (req.method === "GET") {
    try {
      const milestones = await prisma.milestone.findMany({
        where: {
          startupId: startup.id,
        },
        orderBy: {
          dueDate: "asc",
        },
        include: {
          tasks: true,
        },
      });

      return res.status(200).json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle POST request - create milestone
  else if (req.method === "POST") {
    try {
      const { title, description, dueDate, status } = req.body;

      // Validate required fields
      if (!title || !description || !dueDate) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      // Create milestone
      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          status: status || "PENDING",
          startupId: startup.id,
        },
        include: {
          tasks: true,
        },
      });

      return res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle PUT request - update milestone
  else if (req.method === "PUT") {
    try {
      const { id, title, description, dueDate, status, completedDate } =
        req.body;

      if (!id) {
        return res.status(400).json({ message: "Milestone ID is required" });
      }

      // Verify milestone belongs to this startup
      const existingMilestone = await prisma.milestone.findFirst({
        where: {
          id,
          startupId: startup.id,
        },
      });

      if (!existingMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (status) updateData.status = status;

      // Handle completion
      if (status === "COMPLETED" && !existingMilestone.completedDate) {
        updateData.completedDate = new Date();
      } else if (status !== "COMPLETED" && existingMilestone.completedDate) {
        updateData.completedDate = null;
      } else if (completedDate) {
        updateData.completedDate = new Date(completedDate);
      }

      // Update milestone
      const updatedMilestone = await prisma.milestone.update({
        where: { id },
        data: updateData,
        include: {
          tasks: true,
        },
      });

      // If milestone is completed, update all its tasks to completed as well
      if (status === "COMPLETED") {
        await prisma.task.updateMany({
          where: {
            milestoneId: id,
            status: { not: "COMPLETED" },
          },
          data: {
            status: "COMPLETED",
            completedDate: new Date(),
          },
        });
      }

      return res.status(200).json(updatedMilestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle DELETE request - delete milestone
  else if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Milestone ID is required" });
      }

      // Verify milestone belongs to this startup
      const existingMilestone = await prisma.milestone.findFirst({
        where: {
          id,
          startupId: startup.id,
        },
        include: {
          tasks: true,
        },
      });

      if (!existingMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      // Check if milestone has tasks
      if (existingMilestone.tasks.length > 0) {
        return res.status(400).json({
          message:
            "Cannot delete milestone with associated tasks. Please delete tasks first or reassign them.",
        });
      }

      // Delete milestone
      await prisma.milestone.delete({
        where: { id },
      });

      return res
        .status(200)
        .json({ message: "Milestone deleted successfully" });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }
}
