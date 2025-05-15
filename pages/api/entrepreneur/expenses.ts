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
      let startup;
      try {
        startup = await prisma.startup.findFirst({
          where: {
            founderId: session.user.id,
          },
        });
      } catch (error: any) {
        console.error("Database error finding startup:", error);
        return res.status(503).json({
          message: "Unable to connect to the database. Please try again.",
          code: "DB_CONNECTION_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (!startup) {
        return res
          .status(404)
          .json({ message: "No startup found for this user" });
      }

      // Find the approved application
      let approvedApplication;
      try {
        approvedApplication = await prisma.startupCallApplication.findFirst({
          where: {
            startupId: startup.id,
            status: "APPROVED",
          },
          include: {
            call: true,
          },
        });
      } catch (error: any) {
        console.error("Database error finding application:", error);
        return res.status(503).json({
          message: "Database error when finding your approved application.",
          code: "DB_QUERY_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (!approvedApplication) {
        return res
          .status(404)
          .json({ message: "No approved application found" });
      }

      // Get budget for this call
      let budget;
      try {
        budget = await prisma.budget.findFirst({
          where: {
            startupCallId: approvedApplication.callId,
          },
          include: {
            categories: true,
          },
        });
      } catch (error: any) {
        console.error("Database error finding budget:", error);
        return res.status(503).json({
          message: "Database error when retrieving budget information.",
          code: "BUDGET_QUERY_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (!budget) {
        return res
          .status(404)
          .json({ message: "No budget found for your active project" });
      }

      // Get expenses
      let expenses;
      try {
        expenses = await prisma.expense.findMany({
          where: {
            budgetId: budget.id,
          },
          orderBy: {
            date: "desc",
          },
        });
      } catch (error: any) {
        console.error("Database error finding expenses:", error);
        return res.status(503).json({
          message: "Database error when retrieving your expenses.",
          code: "EXPENSE_QUERY_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

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
    } catch (error: any) {
      console.error("Error fetching expenses:", error);

      // Provide more specific error messages based on error type
      if (error.code === "P2021") {
        return res.status(500).json({
          message:
            "The database schema appears to be outdated. Please contact support.",
          code: "SCHEMA_ERROR",
        });
      } else if (error.code === "P2023" || error.code === "P2025") {
        return res.status(400).json({
          message: "Invalid ID format or record not found",
          code: "INVALID_INPUT",
        });
      } else if (
        error.message &&
        (error.message.includes("prepared statement") ||
          error.message.includes("connection") ||
          error.message.includes("network"))
      ) {
        return res.status(503).json({
          message: "Database connection issue. Please try again in a moment.",
          code: "CONNECTION_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      return res.status(500).json({
        message: "Failed to load expense data. Please try again later.",
        code: "SERVER_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
      if (!title || amount === undefined || !categoryId || !date) {
        return res.status(400).json({
          message: "Missing required fields",
          code: "VALIDATION_ERROR",
          details: {
            title: !title ? "Title is required" : undefined,
            amount: amount === undefined ? "Amount is required" : undefined,
            categoryId: !categoryId ? "Category is required" : undefined,
            date: !date ? "Date is required" : undefined,
          },
        });
      }

      // Validate amount is a valid number
      const parsedAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be a positive number",
          code: "VALIDATION_ERROR",
          details: { amount: "Amount must be a positive number" },
        });
      }

      // Find startup with error handling
      let startup;
      try {
        startup = await prisma.startup.findFirst({
          where: {
            founderId: session.user.id,
          },
        });
      } catch (error: any) {
        console.error("Database error finding startup:", error);
        return res.status(503).json({
          message: "Database error when trying to find your startup",
          code: "DB_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (!startup) {
        return res.status(404).json({
          message: "No startup found for this user",
          code: "NOT_FOUND",
        });
      }

      // Find the approved application with error handling
      let approvedApplication;
      try {
        approvedApplication = await prisma.startupCallApplication.findFirst({
          where: {
            startupId: startup.id,
            status: "APPROVED",
          },
        });
      } catch (error: any) {
        console.error("Database error finding application:", error);
        return res.status(503).json({
          message:
            "Database error when trying to find your approved application",
          code: "DB_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (!approvedApplication) {
        return res.status(404).json({
          message: "No approved application found",
          code: "NOT_FOUND",
        });
      }

      // Use a transaction for the remaining database operations to ensure atomicity
      try {
        return await prisma.$transaction(async (tx) => {
          // Get budget for this call
          const budget = await tx.budget.findFirst({
            where: {
              startupCallId: approvedApplication.callId,
            },
            include: {
              categories: true,
              expenses: true,
            },
          });

          if (!budget) {
            return res.status(404).json({
              message: "No budget found",
              code: "NOT_FOUND",
            });
          }

          // Validate category exists
          const category = budget.categories.find(
            (cat) => cat.id === categoryId
          );
          if (!category) {
            return res.status(400).json({
              message: "Invalid category",
              code: "VALIDATION_ERROR",
              details: { categoryId: "Category not found in budget" },
            });
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
          if (parsedAmount > remainingBudget) {
            return res.status(400).json({
              message: `Expense exceeds remaining budget for category ${category.name}. Remaining: ${remainingBudget}`,
              code: "BUDGET_EXCEEDED",
              details: {
                categoryId: category.id,
                categoryName: category.name,
                requested: parsedAmount,
                remaining: remainingBudget,
              },
            });
          }

          // Create expense
          const expense = await tx.expense.create({
            data: {
              budgetId: budget.id,
              categoryId,
              title,
              description,
              amount: parsedAmount,
              currency: budget.currency,
              date: new Date(date),
              status: "PENDING", // All new expenses start as pending
            },
          });

          // Collect extra task and milestone data if provided
          const expenseData: any = { ...expense };

          // If task provided, verify task
          if (taskId) {
            // Verify task belongs to this startup
            const task = await tx.task.findFirst({
              where: {
                id: taskId,
                startupId: startup.id,
              },
              select: {
                id: true,
                title: true,
              },
            });

            if (task) {
              expenseData.taskTitle = task.title;
            }
          }

          // If milestone provided, verify milestone
          if (milestoneId) {
            // Verify milestone belongs to this startup
            const milestone = await tx.milestone.findFirst({
              where: {
                id: milestoneId,
                startupId: startup.id,
              },
              select: {
                id: true,
                title: true,
              },
            });

            if (milestone) {
              expenseData.milestoneTitle = milestone.title;
            }
          }

          // Get the category name for the response
          expenseData.categoryName = category.name;

          return res.status(201).json(expenseData);
        });
      } catch (error: any) {
        console.error("Transaction error creating expense:", error);

        if (error.code === "P2002") {
          return res.status(409).json({
            message: "Duplicate expense entry",
            code: "DUPLICATE_ERROR",
          });
        }

        return res.status(500).json({
          message: "Failed to create expense due to a database error",
          code: "TRANSACTION_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    } catch (error: any) {
      console.error("Error creating expense:", error);

      // Provide specific error information based on error type
      if (error.code) {
        if (error.code === "P2021") {
          return res.status(500).json({
            message:
              "The database schema appears to be outdated. Please contact support.",
            code: "SCHEMA_ERROR",
          });
        } else if (error.code === "P2023" || error.code === "P2025") {
          return res.status(400).json({
            message: "Invalid data format or record not found",
            code: "INVALID_INPUT",
          });
        }
      }

      return res.status(500).json({
        message: "Failed to create expense. Please try again later.",
        code: "SERVER_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
