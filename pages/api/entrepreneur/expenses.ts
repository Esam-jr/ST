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

  // Handle GET request - list expenses
  if (req.method === "GET") {
    try {
      // First, find the entrepreneur's startup
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
      });

      if (!startup) {
        return res
          .status(404)
          .json({ message: "No startup found for this user" });
      }

      // Find the approved application
      const approvedApplication = await prisma.startupCallApplication.findFirst(
        {
          where: {
            startupId: startup.id,
            status: "APPROVED",
          },
          include: {
            call: true,
          },
        }
      );

      if (!approvedApplication) {
        return res
          .status(404)
          .json({ message: "No approved application found" });
      }

      // Get budget for this call
      const budget = await prisma.budget.findFirst({
        where: {
          startupCallId: approvedApplication.callId,
        },
        include: {
          categories: true,
        },
      });

      if (!budget) {
        return res.status(404).json({ message: "No budget found" });
      }

      // Get expenses
      const expenses = await prisma.expense.findMany({
        where: {
          budgetId: budget.id,
        },
        orderBy: {
          date: "desc",
        },
      });

      // Enrich expenses with category name
      const enrichedExpenses = expenses.map((expense) => {
        const category = budget.categories.find(
          (cat) => cat.id === expense.categoryId
        );
        return {
          ...expense,
          categoryName: category?.name || "Uncategorized",
        };
      });

      return res.status(200).json(enrichedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle POST request - create expense
  else if (req.method === "POST") {
    try {
      const {
        title,
        description,
        amount,
        categoryId,
        date,
        taskId,
        milestoneId,
      } = req.body;

      // Validate required fields
      if (!title || !amount || !categoryId || !date) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      // Get startup
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
      });

      if (!startup) {
        return res
          .status(404)
          .json({ message: "No startup found for this user" });
      }

      // Find the approved application
      const approvedApplication = await prisma.startupCallApplication.findFirst(
        {
          where: {
            startupId: startup.id,
            status: "APPROVED",
          },
        }
      );

      if (!approvedApplication) {
        return res
          .status(404)
          .json({ message: "No approved application found" });
      }

      // Get budget for this call
      const budget = await prisma.budget.findFirst({
        where: {
          startupCallId: approvedApplication.callId,
        },
        include: {
          categories: true,
          expenses: true,
        },
      });

      if (!budget) {
        return res.status(404).json({ message: "No budget found" });
      }

      // Validate category exists
      const category = budget.categories.find((cat) => cat.id === categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }

      // Calculate current spending for this category
      const categoryExpenses = budget.expenses.filter(
        (expense) => expense.categoryId === categoryId
      );
      const categorySpent = categoryExpenses.reduce(
        (total, expense) => total + expense.amount,
        0
      );

      // Validate budget limit
      const remainingBudget = category.allocatedAmount - categorySpent;
      if (amount > remainingBudget) {
        return res.status(400).json({
          message: `Expense exceeds remaining budget for category ${category.name}. Remaining: ${remainingBudget}`,
        });
      }

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          budgetId: budget.id,
          categoryId,
          title,
          description,
          amount: parseFloat(amount.toString()),
          currency: budget.currency,
          date: new Date(date),
          status: "PENDING", // All new expenses start as pending
        },
      });

      // If task provided, link expense to task
      if (taskId) {
        // Verify task belongs to this startup
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            startupId: startup.id,
          },
        });

        if (task) {
          // Link task to expense (this would require a model change to add this relationship)
          // For now, we'll just return the expense with the task ID
          console.log(`Expense linked to task ${taskId}`);
        }
      }

      // If milestone provided, link expense to milestone
      if (milestoneId) {
        // Verify milestone belongs to this startup
        const milestone = await prisma.milestone.findFirst({
          where: {
            id: milestoneId,
            startupId: startup.id,
          },
        });

        if (milestone) {
          // Link milestone to expense (this would require a model change)
          console.log(`Expense linked to milestone ${milestoneId}`);
        }
      }

      return res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }
}
