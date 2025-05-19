import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This endpoint only accepts PATCH method
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const startupCallId = req.query.id as string;
  const expenseId = req.query.expenseId as string;

  // Get the new status from request body
  const { status, comment } = req.body;

  // Validate the status value
  if (
    !status ||
    !["approved", "rejected", "pending", "in_review"].includes(status)
  ) {
    return res.status(400).json({
      error:
        "Invalid status value. Must be one of: approved, rejected, pending, in_review",
    });
  }

  try {
    // Check if expense exists and belongs to the startup call
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        budget: {
          startupCallId,
        },
      },
      include: {
        budget: {
          include: {
            categories: true,
          },
        },
        category: true,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // If approving, check that it doesn't exceed category budget
    if (status === "approved" && expense.category) {
      // Get all approved expenses for this category
      const approvedExpenses = await prisma.expense.findMany({
        where: {
          categoryId: expense.category.id,
          status: "approved",
          id: { not: expenseId }, // Exclude the current expense
        },
      });

      // Calculate total spent amount
      const totalSpent = approvedExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      // Check if approving this expense would exceed budget
      if (totalSpent + expense.amount > expense.category.allocatedAmount) {
        return res.status(400).json({
          error: "Approving this expense would exceed the category budget",
          details: {
            categoryName: expense.category.name,
            allocatedAmount: expense.category.allocatedAmount,
            currentSpent: totalSpent,
            expenseAmount: expense.amount,
            remaining: expense.category.allocatedAmount - totalSpent,
          },
        });
      }
    }

    // Update the expense status
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status,
        // If a comment was provided, store it in the description with a prefix
        ...(comment
          ? {
              description: expense.description
                ? `${
                    expense.description
                  }\n\n[Admin ${status.toUpperCase()} comment: ${comment}]`
                : `[Admin ${status.toUpperCase()} comment: ${comment}]`,
            }
          : {}),
      },
      include: {
        category: true,
        budget: true,
      },
    });

    // Get the startup associated with this expense
    const startup = await prisma.startup.findFirst({
      where: {
        callApplications: {
          some: {
            callId: startupCallId,
            status: "APPROVED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        founderId: true,
      },
    });

    // Create a notification for the entrepreneur
    if (startup) {
      await prisma.notification.create({
        data: {
          userId: startup.founderId,
          title: `Expense ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your expense "${updatedExpense.title}" has been ${status}${
            comment ? ` with comment: ${comment}` : ""
          }.`,
          read: false,
          type:
            status === "approved"
              ? "SUCCESS"
              : status === "rejected"
              ? "ERROR"
              : "INFO",
        },
      });
    }

    return res.status(200).json({
      ...updatedExpense,
      message: `Expense has been ${status} successfully`,
    });
  } catch (error) {
    console.error(`Error updating expense status:`, error);
    return res.status(500).json({ error: "Failed to update expense status" });
  }
}
