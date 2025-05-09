import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { withPrisma } from "@/lib/prisma-wrapper";
import { PrismaClient } from "@prisma/client";

// Handler for budget operations
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get session and check if user is authorized
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get startup call ID from URL
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid startup call ID" });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case "GET":
      return await getBudgets(req, res, id);
    case "POST":
      return await createBudget(req, res, id, session.user.id);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

// Get all budgets for a startup call
async function getBudgets(
  req: NextApiRequest,
  res: NextApiResponse,
  startupCallId: string
) {
  try {
    const result = await withPrisma(async () => {
      const prisma = new PrismaClient();
      try {
        // Verify that the startup call exists
        const startupCall = await prisma.startupCall.findUnique({
          where: { id: startupCallId },
        });

        if (!startupCall) {
          return res.status(404).json({ error: "Startup call not found" });
        }

        // Get all budgets for the startup call
        const budgets = await prisma.budget.findMany({
          where: { startupCallId },
          orderBy: { createdAt: "desc" },
        });

        return budgets;
      } finally {
        await prisma.$disconnect();
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return res.status(500).json({ error: "Failed to fetch budgets" });
  }
}

// Create a new budget for a startup call
async function createBudget(
  req: NextApiRequest,
  res: NextApiResponse,
  startupCallId: string,
  userId: string
) {
  const { title, description, totalAmount, currency, fiscalYear, status } =
    req.body;

  if (!title || !totalAmount || !currency) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await withPrisma(async () => {
      const prisma = new PrismaClient();
      try {
        // Verify that the startup call exists
        const startupCall = await prisma.startupCall.findUnique({
          where: { id: startupCallId },
        });

        if (!startupCall) {
          return res.status(404).json({ error: "Startup call not found" });
        }

        // Create the budget
        const budget = await prisma.budget.create({
          data: {
            title,
            description,
            totalAmount: parseFloat(totalAmount),
            currency,
            fiscalYear: fiscalYear || new Date().getFullYear().toString(),
            status: status || "draft",
            startupCall: { connect: { id: startupCallId } },
          },
        });

        return budget;
      } finally {
        await prisma.$disconnect();
      }
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating budget:", error);
    return res.status(500).json({ error: "Failed to create budget" });
  }
}
