import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
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

  // Get session and verify authorization
  const session = await getServerSession(req, res, authOptions);

  if (
    !session ||
    !session.user ||
    !["ADMIN", "SPONSOR", "REVIEWER"].includes(session.user.role)
  ) {
    return res.status(401).json({
      message: "You are not authorized to perform this action",
      code: "UNAUTHORIZED",
    });
  }

  // Get expense ID from the URL
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({
      message: "Expense ID is required",
      code: "MISSING_PARAMETER",
    });
  }

  // Get status from request body
  const { status, feedback } = req.body;
  if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return res.status(400).json({
      message: "Valid status (APPROVED, REJECTED, PENDING) is required",
      code: "INVALID_STATUS",
    });
  }

  try {
    // Update the expense status
    const updatedExpense = await prisma.$transaction(async (tx) => {
      // First, get the expense to verify it exists and get necessary information
      const expense = await tx.expense.findUnique({
        where: { id },
        include: {
          budget: {
            include: {
              startupCall: {
                include: {
                  applications: {
                    where: {
                      status: "APPROVED",
                    },
                    include: {
                      startup: {
                        select: {
                          id: true,
                          founderId: true,
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

      if (!expense) {
        throw new Error("Expense not found");
      }

      // Get the startupId and founderId for notification
      let startupId = null;
      let founderId = null;
      let startupCallId = expense.budget.startupCallId;

      if (expense.budget?.startupCall?.applications?.length > 0) {
        startupId = expense.budget.startupCall.applications[0].startup.id;
        founderId =
          expense.budget.startupCall.applications[0].startup.founderId;
      }

      // Update the expense
      const updated = await tx.expense.update({
        where: { id },
        data: {
          status,
          // Add updatedAt timestamp automatically
        },
        include: {
          category: true,
        },
      });

      // Create a notification for the entrepreneur
      if (founderId) {
        await tx.notification.create({
          data: {
            userId: founderId,
            title: `Expense ${status.toLowerCase()}`,
            message:
              status === "APPROVED"
                ? `Your expense "${expense.title}" for ${expense.amount} ${expense.currency} has been approved.`
                : status === "REJECTED"
                ? `Your expense "${expense.title}" for ${expense.amount} ${
                    expense.currency
                  } has been rejected. ${feedback || ""}`
                : `Your expense "${expense.title}" status has been updated.`,
            type:
              status === "APPROVED"
                ? "SUCCESS"
                : status === "REJECTED"
                ? "ERROR"
                : "INFO",
            isRead: false,
            link: `/entrepreneur-dashboard/expenses`,
          },
        });
      }

      return {
        ...updated,
        categoryName: updated.category?.name || "Uncategorized",
        startupId,
        founderId,
        startupCallId,
      };
    });

    return res.status(200).json(updatedExpense);
  } catch (error: any) {
    console.error("Error updating expense status:", error);

    if (error.message === "Expense not found") {
      return res.status(404).json({
        message: "Expense not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(500).json({
      message: "Failed to update expense status",
      code: "SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
