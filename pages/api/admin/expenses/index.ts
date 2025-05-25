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
      const { startupCallId, status, startupId } = req.query;

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

      if (startupId && typeof startupId === "string") {
        where.startup = {
          id: startupId,
        };
      }

      // Fetch startup calls for the filter UI
      const startupCalls = await prisma.startupCall.findMany({
        select: {
          id: true,
          title: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

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
              categories: {
                select: {
                  id: true,
                  name: true,
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // PENDING first
          { date: "desc" }, // Most recent first
        ],
      });

      // Transform data to add the startup name for convenience
      const transformedExpenses = expenses.map((expense) => {
        const budgetCategory = expense.budget.categories.find(
          (cat) => cat.id === expense.categoryId
        );

        return {
          ...expense,
          categoryName:
            expense.category?.name || budgetCategory?.name || "Unknown",
          startupCall: expense.budget.startupCall,
        };
      });

      // Get the unique startupCallIds from the expenses
      const startupCallIds = Array.from(
        new Set(expenses.map((e) => e.budget.startupCallId))
      );

      // Get all startups that have approved applications for these startup calls
      const startups = await prisma.startup.findMany({
        where: {
          callApplications: {
            some: {
              callId: {
                in: startupCallIds.filter(Boolean),
              },
              status: "APPROVED",
            },
          },
        },
        include: {
          founder: {
            select: {
              id: true,
              name: true,
            },
          },
          callApplications: {
            where: {
              status: "APPROVED",
              callId: {
                in: startupCallIds.filter(Boolean),
              },
            },
            select: {
              callId: true,
            },
          },
        },
      });

      // Transform startup data for easier frontend use
      const startupInfo = startups.map((startup) => ({
        id: startup.id,
        name: startup.name,
        founderId: startup.founder.id,
        founderName: startup.founder.name,
        callIds: startup.callApplications.map((app) => app.callId),
      }));

      // Return the expenses and related data
      return res.status(200).json({
        expenses: transformedExpenses,
        startups: startupInfo,
        startupCalls,
        filters: {
          startupCallId: startupCallId || null,
          status: status || null,
          startupId: startupId || null,
        },
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
      if (!budgetId || !title || !amount || !date || !categoryId) {
        return res.status(400).json({
          error:
            "Missing required fields: budgetId, categoryId, title, amount, and date are required",
        });
      }

      // Validate budget exists and get its startup
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          startup: true,
        }
      });

      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      // Get any milestone (using the first one if exists)
      const milestone = await prisma.milestone.findFirst({
        where: { startupId: budget.startupId }
      });

      if (!milestone) {
        return res.status(400).json({ error: "No milestone found for this startup. Please create a milestone first." });
      }

      // Create the new expense
      const newExpense = await prisma.expense.create({
        data: {
          title,
          description,
          amount: Number(amount),
          date: new Date(date),
          status: status || "PENDING",
          budget: { connect: { id: budgetId } },
          category: { connect: { id: categoryId } },
          startup: { connect: { id: budget.startupId } },
          milestone: { connect: { id: milestone.id } },
          user: { connect: { id: session.user.id } }
        },
        include: {
          budget: true,
          category: true,
          startup: true,
          milestone: true,
          user: true
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
