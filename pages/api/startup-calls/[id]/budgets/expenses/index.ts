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
  const { budgetId } = req.query;

  if (!budgetId || typeof budgetId !== "string") {
    return res.status(400).json({ error: "Budget ID is required" });
  }

  // Check if budget exists and belongs to the startup call
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      startupCallId,
    },
  });

  if (!budget) {
    return res.status(404).json({ error: "Budget not found" });
  }

  // Handle GET request - get all expenses for a budget
  if (req.method === "GET") {
    try {
      const expenses = await prisma.expense.findMany({
        where: { budgetId },
        include: {
          category: true,
        },
        orderBy: { date: "desc" },
      });

      return res.status(200).json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Error fetching expenses" });
    }
  }

  // Handle POST request - create a new expense
  if (req.method === "POST") {
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

      // Create the expense
      const expense = await prisma.expense.create({
        data: {
          title,
          description,
          amount,
          currency,
          date: new Date(date),
          receipt,
          status,
          budget: {
            connect: { id: budgetId },
          },
          ...(categoryId && {
            category: {
              connect: { id: categoryId },
            },
          }),
        },
        include: {
          category: true,
        },
      });

      return res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Error creating expense" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
