import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return res.status(405).json({
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // Get the expense ID from the URL
  const { id } = req.query;
  const { status, feedback } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      message: "Invalid expense ID",
      code: "INVALID_ID",
    });
  }

  if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be APPROVED, REJECTED, or PENDING",
      code: "INVALID_STATUS",
    });
  }

  try {
    // Get user session to verify admin authorization
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return res.status(401).json({
        message: "Unauthorized. Only administrators can approve expenses",
        code: "UNAUTHORIZED",
      });
    }

    // Find the expense first to check it exists
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
        category: true,
      },
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
        code: "NOT_FOUND",
      });
    }

    // Update the expense status
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status,
        // Add feedback if provided (optional field we'd need to add to the schema)
        ...(feedback && {
          description: `${
            expense.description || ""
          }\n\nAdmin feedback: ${feedback}`,
        }),
      },
      include: {
        category: true,
      },
    });

    // Get budget with categories to calculate updated budget figures
    const budget = await prisma.budget.findUnique({
      where: { id: expense.budgetId },
      include: {
        categories: true,
        expenses: true,
      },
    });

    // Calculate new budget figures with the updated expense status
    const totalSpent =
      budget?.expenses.reduce((total, exp) => {
        // Only count APPROVED expenses towards spent amount
        if (exp.status === "APPROVED") {
          return total + exp.amount;
        }
        return total;
      }, 0) || 0;

    // Calculate category spending
    const categorySpending = budget?.categories.map((category) => {
      const categoryExpenses = budget.expenses.filter(
        (exp) => exp.categoryId === category.id && exp.status === "APPROVED"
      );
      const categorySpent = categoryExpenses.reduce(
        (total, exp) => total + exp.amount,
        0
      );
      return {
        id: category.id,
        spent: categorySpent,
        remaining: category.allocatedAmount - categorySpent,
      };
    });

    // Format response with budget impact
    const response = {
      expense: updatedExpense,
      budget: {
        id: budget?.id,
        totalAmount: budget?.totalAmount || 0,
        spent: totalSpent,
        remaining: (budget?.totalAmount || 0) - totalSpent,
        categoryImpact: categorySpending,
      },
      message: `Expense has been ${status.toLowerCase()}`,
    };

    // Notification logic would go here (future enhancement)

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error updating expense status:", error);
    return res.status(500).json({
      message: "Failed to update expense status",
      code: "SERVER_ERROR",
    });
  }
}
