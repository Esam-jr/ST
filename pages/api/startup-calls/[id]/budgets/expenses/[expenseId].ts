import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: { role: true },
  });

  // Check if user has admin role
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const startupCallId = req.query.id as string;
  const expenseId = req.query.expenseId as string;
  const { budgetId } = req.query;

  if (!budgetId || typeof budgetId !== "string") {
    return res.status(400).json({ error: "Budget ID is required" });
  }

  // Check if expense exists and belongs to the budget and startup call
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      budget: {
        id: budgetId,
        startupCallId,
      },
    },
  });

  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  // Handle GET request - get expense details
  if (req.method === "GET") {
    try {
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          category: true,
        },
      });

      return res.status(200).json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      return res.status(500).json({ error: "Error fetching expense" });
    }
  }

  // Handle PUT request - update an expense
  if (req.method === "PUT") {
    try {
      const {
        categoryId,
        title,
        description,
        amount,
        currency,
        date,
        receipt,
        status,
      } = req.body;

      // Validate required fields
      if (!title || !amount || !currency || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // If categoryId is provided, check if the category belongs to the budget
      if (categoryId) {
        const category = await prisma.budgetCategory.findFirst({
          where: {
            id: categoryId,
            budgetId,
          },
        });

        if (!category) {
          return res
            .status(400)
            .json({ error: "Invalid category for this budget" });
        }
      }

      // Update the expense
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          title,
          description,
          amount,
          currency,
          date: new Date(date),
          receipt,
          status,
          ...(categoryId
            ? { category: { connect: { id: categoryId } } }
            : { categoryId: null }),
        },
        include: {
          category: true,
        },
      });

      return res.status(200).json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      return res.status(500).json({ error: "Error updating expense" });
    }
  }

  // Handle DELETE request - delete an expense
  if (req.method === "DELETE") {
    try {
      await prisma.expense.delete({
        where: { id: expenseId },
      });

      return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      return res.status(500).json({ error: "Error deleting expense" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
