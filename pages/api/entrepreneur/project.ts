import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { StartupCallApplicationStatus } from "@prisma/client";

interface ProjectResponse {
  id: string;
  startupCallId: string;
  startupCallTitle: string;
  budget: {
    id: string;
    totalAmount: number;
    spent: number;
    remaining: number;
    categories: Array<{
      id: string;
      name: string;
      allocatedAmount: number;
      spent: number;
      remaining: number;
    }>;
    expenses: Array<{
      id: string;
      title: string;
      amount: number;
      date: string;
      categoryId: string;
      status: string;
    }>;
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
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || session.user.role !== "ENTREPRENEUR") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // First, find the entrepreneur's startup
    const startup = await prisma.startup.findFirst({
      where: {
        founderId: session.user.id,
      },
      include: {
        callApplications: {
          where: {
            status: StartupCallApplicationStatus.APPROVED,
          },
          include: {
            call: true,
          },
        },
        milestones: true,
      },
    });

    if (!startup) {
      return res
        .status(404)
        .json({ message: "No startup found for this user" });
    }

    // Check if the startup has any approved applications
    if (!startup.callApplications || startup.callApplications.length === 0) {
      return res
        .status(404)
        .json({ message: "No approved applications found" });
    }

    // Get the approved application & call
    const approvedApplication = startup.callApplications[0]; // Take the first approved application

    // Fetch budget for this call
    const budget = await prisma.budget.findFirst({
      where: {
        startupCallId: approvedApplication.callId,
      },
      include: {
        expenses: true,
        categories: true,
      },
    });

    if (!budget) {
      return res
        .status(404)
        .json({ message: "No budget found for this project" });
    }

    // Calculate spent amount from expenses
    const spent = budget.expenses.reduce(
      (total: number, expense) => total + expense.amount,
      0
    );

    // Calculate category-wise spending
    const categorySpending = budget.categories.map((category) => {
      const categoryExpenses = budget.expenses.filter(
        (expense) => expense.categoryId === category.id
      );
      const categorySpent = categoryExpenses.reduce(
        (total, expense) => total + expense.amount,
        0
      );
      return {
        id: category.id,
        name: category.name,
        allocatedAmount: category.allocatedAmount,
        spent: categorySpent,
        remaining: category.allocatedAmount - categorySpent,
      };
    });

    // Format response
    const projectResponse: ProjectResponse = {
      id: startup.id,
      startupCallId: approvedApplication.call.id,
      startupCallTitle: approvedApplication.call.title,
      budget: {
        id: budget.id,
        totalAmount: budget.totalAmount || 0,
        spent: spent || 0,
        remaining: (budget.totalAmount || 0) - (spent || 0),
        categories: categorySpending,
        expenses: budget.expenses.map((expense) => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          date: expense.date.toISOString(),
          categoryId: expense.categoryId || "",
          status: expense.status,
        })),
      },
      timeline: {
        milestones: startup.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
          dueDate: milestone.dueDate.toISOString(),
          status: milestone.status,
        })),
      },
    };

    return res.status(200).json(projectResponse);
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
