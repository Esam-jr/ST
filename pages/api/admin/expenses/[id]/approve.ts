import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== "ADMIN") {
      return res
        .status(401)
        .json({ error: "Unauthorized: Admin access required" });
    }

    // Get expense ID from URL
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    // Get expense status from request body
    const { status, feedback } = req.body;

    // Validate status
    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res
        .status(400)
        .json({
          error: "Invalid status. Must be APPROVED, REJECTED, or PENDING",
        });
    }

    // Find the expense
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            categories: true,
            expenses: {
              where: {
                status: "APPROVED", // Only include approved expenses for budget calculation
              },
            },
          },
        },
        category: true,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Update expense status and add feedback to description if provided
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status,
        description: feedback
          ? `${expense.description || ""}\n\nAdmin feedback: ${feedback}`
          : expense.description,
      },
      include: {
        budget: true,
        category: true,
      },
    });

    // Recalculate budget totals
    const budget = await prisma.budget.findUnique({
      where: { id: expense.budgetId },
      include: {
        categories: {
          include: {
            expenses: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
        expenses: {
          where: {
            status: "APPROVED",
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Calculate total spent amount
    const totalSpent = budget.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Calculate remaining budget
    const remaining = budget.totalAmount - totalSpent;

    // Calculate category spending
    const categorySpending = budget.categories.map((category) => {
      const spent = category.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const allocated = category.allocatedAmount;
      const remainingInCategory = allocated - spent;

      return {
        id: category.id,
        name: category.name,
        allocated,
        spent,
        remaining: remainingInCategory,
        percentage: allocated > 0 ? (spent / allocated) * 100 : 0,
      };
    });

    return res.status(200).json({
      expense: updatedExpense,
      budget: {
        id: budget.id,
        title: budget.title,
        totalAmount: budget.totalAmount,
        spent: totalSpent,
        remaining,
        categories: categorySpending,
      },
    });
  } catch (error) {
    console.error("Error handling expense approval:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
