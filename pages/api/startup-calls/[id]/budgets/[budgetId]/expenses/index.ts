import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { withPrisma } from "@/lib/prisma-wrapper";
import { PrismaClient } from "@prisma/client";

// Handler for budget expenses operations
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get session and check if user is authorized
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get startup call ID and budget ID from URL
  const { id, budgetId } = req.query;

  if (
    !id ||
    typeof id !== "string" ||
    !budgetId ||
    typeof budgetId !== "string"
  ) {
    return res.status(400).json({ error: "Invalid URL parameters" });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return await getExpenses(req, res, budgetId);
    case "POST":
      return await createExpense(req, res, budgetId, session.user.id);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

// Get all expenses for a budget
async function getExpenses(
  req: NextApiRequest,
  res: NextApiResponse,
  budgetId: string
) {
  try {
    // Get query parameters
    const { categoryId, status } = req.query;

    const result = await withPrisma(async () => {
      const prisma = new PrismaClient();
      try {
        // Verify that the budget exists
        const budget = await prisma.budget.findUnique({
          where: { id: budgetId },
        });

        if (!budget) {
          return null; // Will be checked outside
        }

        // Build where clause based on query parameters
        const where: any = { budgetId };

        if (categoryId && typeof categoryId === "string") {
          where.categoryId = categoryId;
        }

        if (status && typeof status === "string") {
          where.status = status;
        }

        // Get all expenses for the budget
        const expenses = await prisma.expense.findMany({
          where,
          orderBy: { date: "desc" },
          include: {
            category: true,
          },
        });

        return expenses;
      } finally {
        await prisma.$disconnect();
      }
    });

    if (result === null) {
      return res.status(404).json({ error: "Budget not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching budget expenses:", error);
    return res.status(500).json({ error: "Failed to fetch budget expenses" });
  }
}

// Create a new expense for a budget
async function createExpense(
  req: NextApiRequest,
  res: NextApiResponse,
  budgetId: string,
  userId: string
) {
  const { title, description, amount, currency, date, status, categoryId } =
    req.body;

  if (!title || amount === undefined || !currency || !date || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await withPrisma(async () => {
      const prisma = new PrismaClient();
      try {
        // Verify that the budget exists
        const budget = await prisma.budget.findUnique({
          where: { id: budgetId },
        });

        if (!budget) {
          return null; // Will be checked outside
        }

        // Verify that the category exists if provided
        if (categoryId) {
          const category = await prisma.budgetCategory.findUnique({
            where: { id: categoryId },
          });

          if (!category || category.budgetId !== budgetId) {
            return {
              error: "Category not found or does not belong to this budget",
            };
          }
        }

        // Create the expense
        const expense = await prisma.expense.create({
          data: {
            title,
            description,
            amount: parseFloat(amount.toString()),
            currency,
            date: new Date(date),
            status,
            budget: { connect: { id: budgetId } },
            ...(categoryId
              ? { category: { connect: { id: categoryId } } }
              : {}),
          },
        });

        return expense;
      } finally {
        await prisma.$disconnect();
      }
    });

    if (result === null) {
      return res.status(404).json({ error: "Budget not found" });
    }

    if (result && "error" in result) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating budget expense:", error);
    return res.status(500).json({ error: "Failed to create budget expense" });
  }
}
