import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get session and verify authorization
  const session = await getServerSession(req, res, authOptions);

  if (
    !session ||
    !session.user ||
    !["ADMIN", "SPONSOR", "REVIEWER"].includes(session.user.role)
  ) {
    return res.status(401).json({
      message: "You are not authorized to access this resource",
      code: "UNAUTHORIZED",
    });
  }

  // Handle GET request - list all expenses for admin review
  if (req.method === "GET") {
    try {
      // Parse query parameters
      const { status, startupId, startupCallId, limit, offset } = req.query;

      // Build where clause based on filters
      const where: any = {};

      if (status && typeof status === "string") {
        where.status = status;
      }

      // For filtering by startup or startup call, we need to join through budget
      if (startupCallId && typeof startupCallId === "string") {
        where.budget = {
          startupCallId,
        };
      }

      // Query expenses with startup information
      const expenses = await prisma.expense.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit ? parseInt(limit as string) : 50,
        skip: offset ? parseInt(offset as string) : 0,
        include: {
          budget: {
            include: {
              startupCall: {
                select: {
                  id: true,
                  title: true,
                  applications: {
                    where: {
                      status: "APPROVED",
                    },
                    select: {
                      startup: {
                        select: {
                          id: true,
                          name: true,
                          founderId: true,
                          founder: {
                            select: {
                              id: true,
                              name: true,
                              email: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          category: true,
        },
      });

      // Filter by startupId if provided
      // This is done post-query because of the complex relation
      let filteredExpenses = expenses;
      if (startupId && typeof startupId === "string") {
        filteredExpenses = expenses.filter((expense) => {
          const apps = expense.budget?.startupCall?.applications || [];
          return apps.some((app) => app.startup.id === startupId);
        });
      }

      // Transform the response to a more convenient format
      const transformedExpenses = filteredExpenses.map((expense) => {
        const applications = expense.budget?.startupCall?.applications || [];
        const startup =
          applications.length > 0 ? applications[0].startup : null;

        return {
          id: expense.id,
          title: expense.title,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          date: expense.date,
          status: expense.status,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
          categoryId: expense.categoryId,
          categoryName: expense.category?.name || "Uncategorized",
          budgetId: expense.budgetId,
          startupCallId: expense.budget?.startupCallId,
          startupCallTitle: expense.budget?.startupCall?.title,
          startupId: startup?.id,
          startupName: startup?.name,
          founderName: startup?.founder?.name,
          founderEmail: startup?.founder?.email,
          founderId: startup?.founderId,
        };
      });

      // Get total count for pagination
      const totalCount = await prisma.expense.count({
        where,
      });

      return res.status(200).json({
        expenses: transformedExpenses,
        totalCount,
        offset: offset ? parseInt(offset as string) : 0,
        limit: limit ? parseInt(limit as string) : 50,
      });
    } catch (error: any) {
      console.error("Error fetching expenses for admin:", error);
      return res.status(500).json({
        message: "Failed to fetch expenses",
        code: "SERVER_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
      code: "METHOD_NOT_ALLOWED",
    });
  }
}
