import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email as string },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  // GET - Fetch expenses with filters
  if (req.method === "GET") {
    try {
      const { startupCallId, status } = req.query;

      // Build the query
      const where: any = {};

      // Add filters if provided
      if (startupCallId && typeof startupCallId === "string") {
        where.budget = {
          startupCallId,
        };
      }

      if (status && typeof status === "string") {
        where.status = status.toUpperCase();
      }

      // Fetch expenses with necessary relations
      const expenses = await prisma.expense.findMany({
        where,
        include: {
          budget: {
            include: {
              startupCall: {
                select: {
                  id: true,
                  title: true,
                },
              },
              application: {
                include: {
                  startup: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // PENDING first
          { date: "desc" }, // Most recent first
        ],
      });

      // Transform data to add the startup name for convenience
      const transformedExpenses = expenses.map((expense) => ({
        ...expense,
        startupName: expense.budget.application?.startup.name || "Unknown",
      }));

      return res.status(200).json({
        expenses: transformedExpenses,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST - Create a new expense (admin override)
  else if (req.method === "POST") {
    try {
      const { budgetId, categoryId, title, description, amount, date, status } =
        req.body;

      // Validate required fields
      if (!budgetId || !title || !amount || !date) {
        return res.status(400).json({
          error:
            "Missing required fields: budgetId, title, amount, and date are required",
        });
      }

      // Validate budget exists
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
      });

      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      // Create the new expense
      const newExpense = await prisma.expense.create({
        data: {
          budgetId,
          categoryId,
          title,
          description,
          amount: Number(amount),
          date: new Date(date),
          status: status || "APPROVED", // Admin-created expenses are approved by default
          currency: "INR", // Hardcoded for now, could be made configurable
        },
        include: {
          budget: true,
          category: true,
        },
      });

      return res.status(201).json(newExpense);
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Unsupported method
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
