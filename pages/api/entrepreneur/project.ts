import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { Status, StartupCallApplicationStatus, Prisma } from "@prisma/client";

interface ProjectResponse {
  id: string;
  startupCallId: string;
  startupCallTitle: string;
  budget: {
    id: string;
    totalAmount: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
  timeline: {
    milestones: Array<{
      id: string;
      title: string;
      dueDate: string;
      status: string;
    }>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the entrepreneur's user ID from the session
    const userId = session.user.id;

    // First, find any approved applications from this entrepreneur
    const approvedApplications = await prisma.startupCallApplication.findMany({
      where: {
        userId: userId,
        status: StartupCallApplicationStatus.APPROVED,
      },
      include: {
        call: {
          select: {
            id: true,
            title: true,
          },
        },
        startup: true,
      },
    });

    // If no approved applications, return 404
    if (!approvedApplications || approvedApplications.length === 0) {
      return res
        .status(404)
        .json({ message: "No approved applications found" });
    }

    // Use the first approved application
    const approvedApplication = approvedApplications[0];

    // Make sure we have a linked startup
    if (!approvedApplication.startup) {
      return res
        .status(404)
        .json({ message: "No startup linked to the approved application" });
    }

    const startup = approvedApplication.startup;

    // Fetch budget information
    const budget = await prisma.budget.findFirst({
      where: {
        startupCallId: approvedApplication.call.id,
      },
      include: {
        expenses: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!budget) {
      return res
        .status(404)
        .json({ message: "No budget found for this project" });
    }

    // Fetch tasks and milestones
    const tasks = await prisma.task.findMany({
      where: {
        startupId: startup.id,
      },
    });

    const milestones = await prisma.milestone.findMany({
      where: {
        startupId: startup.id,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Calculate total spent amount from expenses
    const spent = budget.expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;

    // Format the response
    const response: ProjectResponse = {
      id: startup.id,
      startupCallId: approvedApplication.call.id,
      startupCallTitle: approvedApplication.call.title,
      budget: {
        id: budget.id,
        totalAmount: budget.totalAmount,
        spent,
        remaining: budget.totalAmount - spent,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
      },
      timeline: {
        milestones: milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
          dueDate: milestone.dueDate.toISOString(),
          status: milestone.status.toLowerCase(),
        })),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
