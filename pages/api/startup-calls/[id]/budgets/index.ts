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

        // Get all budgets for the startup call with their categories
        const budgets = await prisma.budget.findMany({
          where: { startupCallId },
          orderBy: { createdAt: "desc" },
          include: {
            categories: true,
          },
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
  const {
    totalAmount,
    startDate,
    endDate,
    categories,
  } = req.body;

  if (!totalAmount || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields: totalAmount, startDate, and endDate are required" });
  }

  try {
    const result = await withPrisma(async () => {
      const prisma = new PrismaClient();
      try {
        // First get the startup call
        const startupCall = await prisma.startupCall.findUnique({
          where: { id: startupCallId }
        });

        if (!startupCall) {
          return null; // Will be checked outside
        }

        // Find or create system startup for budget allocation
        let systemStartup = await prisma.startup.findFirst({
          where: {
            name: "System Budget Allocation",
            founderId: userId
          }
        });

        if (!systemStartup) {
          // Create a system startup for budget allocation
          systemStartup = await prisma.startup.create({
            data: {
              name: "System Budget Allocation",
              description: "System startup for budget allocation purposes",
              pitch: "Internal system startup for budget management",
              industry: ["System"],
              stage: "SYSTEM",
              founderId: userId,
              status: "SUBMITTED"
            }
          });
        }

        // Use transaction to create budget and categories
        return await prisma.$transaction(async (tx) => {
          // Create the budget
          const budget = await tx.budget.create({
            data: {
              totalAmount: parseFloat(totalAmount.toString()),
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              startupCall: { connect: { id: startupCallId } },
              startup: { connect: { id: systemStartup.id } }
            },
          });

          // Create categories if provided
          if (categories && Array.isArray(categories) && categories.length > 0) {
            for (const category of categories) {
              await tx.category.create({
                data: {
                  name: category.name,
                  description: category.description || null,
                  allocatedAmount: parseFloat(category.allocatedAmount.toString()),
                  budget: { connect: { id: budget.id } },
                },
              });
            }
          }

          // Return the budget with its categories
          return tx.budget.findUnique({
            where: { id: budget.id },
            include: {
              categories: true,
            },
          });
        });
      } finally {
        await prisma.$disconnect();
      }
    });

    if (result === null) {
      return res.status(404).json({ error: "Startup call not found" });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating budget:", error);
    return res.status(500).json({ error: "Failed to create budget" });
  }
}
