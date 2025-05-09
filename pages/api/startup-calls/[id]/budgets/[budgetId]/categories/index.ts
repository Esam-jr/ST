import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { withPrisma } from "@/lib/prisma-wrapper";
import { PrismaClient } from "@prisma/client";

// Handler for budget category operations
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
      return await getCategories(req, res, budgetId);
    case "POST":
      return await createCategory(req, res, budgetId);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

// Get all categories for a budget
async function getCategories(
  req: NextApiRequest,
  res: NextApiResponse,
  budgetId: string
) {
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

        // Get all categories for the budget
        const categories = await prisma.budgetCategory.findMany({
          where: { budgetId },
          orderBy: { createdAt: "desc" },
        });

        return categories;
      } finally {
        await prisma.$disconnect();
      }
    });

    if (result === null) {
      return res.status(404).json({ error: "Budget not found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return res.status(500).json({ error: "Failed to fetch budget categories" });
  }
}

// Create a new category for a budget
async function createCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  budgetId: string
) {
  const { name, description, allocatedAmount } = req.body;

  if (!name || allocatedAmount === undefined) {
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

        // Create the category
        const category = await prisma.budgetCategory.create({
          data: {
            name,
            description,
            allocatedAmount: parseFloat(allocatedAmount),
            budget: { connect: { id: budgetId } },
          },
        });

        return category;
      } finally {
        await prisma.$disconnect();
      }
    });

    if (result === null) {
      return res.status(404).json({ error: "Budget not found" });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating budget category:", error);
    return res.status(500).json({ error: "Failed to create budget category" });
  }
}
