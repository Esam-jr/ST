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

  // Handle GET request - list tasks
  if (req.method === "GET") {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          startupId: startup.id,
        },
        orderBy: {
          dueDate: "asc",
        },
        include: {
          milestone: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle POST request - create task
  else if (req.method === "POST") {
    try {
      const {
        title,
        description,
        priority,
        status,
        startDate,
        dueDate,
        milestoneId,
        assigneeId,
      } = req.body;

      // Validate required fields
      if (!title || !startDate || !dueDate || !priority) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      // If milestone ID provided, verify it belongs to this startup
      if (milestoneId) {
        const milestone = await prisma.milestone.findFirst({
          where: {
            id: milestoneId,
            startupId: startup.id,
          },
        });

        if (!milestone) {
          return res.status(400).json({ message: "Invalid milestone" });
        }
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || "PENDING",
          priority,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
          milestoneId,
          assigneeId,
          startupId: startup.id,
          creatorId: session.user.id,
        },
        include: {
          milestone: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle PUT request - update task
  else if (req.method === "PUT") {
    try {
      const {
        id,
        title,
        description,
        priority,
        status,
        startDate,
        dueDate,
        milestoneId,
        assigneeId,
        completedDate,
      } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      // Verify task belongs to this startup
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          startupId: startup.id,
        },
      });

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // If milestone ID provided, verify it belongs to this startup
      if (milestoneId) {
        const milestone = await prisma.milestone.findFirst({
          where: {
            id: milestoneId,
            startupId: startup.id,
          },
        });

        if (!milestone) {
          return res.status(400).json({ message: "Invalid milestone" });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (startDate) updateData.startDate = new Date(startDate);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (milestoneId !== undefined) updateData.milestoneId = milestoneId;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

      // Handle completion
      if (status === "COMPLETED" && !existingTask.completedDate) {
        updateData.completedDate = new Date();
      } else if (status !== "COMPLETED" && existingTask.completedDate) {
        updateData.completedDate = null;
      } else if (completedDate) {
        updateData.completedDate = new Date(completedDate);
      }

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          milestone: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle DELETE request - delete task
  else if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Task ID is required" });
      }

      // Verify task belongs to this startup
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          startupId: startup.id,
        },
      });

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Delete task
      await prisma.task.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
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
