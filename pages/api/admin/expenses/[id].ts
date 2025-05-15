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

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  // PATCH - Update expense status
  if (req.method === "PATCH") {
    const { status } = req.body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be APPROVED or REJECTED." });
    }

    try {
      // Find the expense first
      const expense = await prisma.expense.findUnique({
        where: { id },
        include: {
          budget: true,
          category: true,
        },
      });

      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      // If approving, check if this would exceed the budget's limit for this category
      if (status === "APPROVED") {
        // Get all approved expenses for this budget and category
        const approvedExpenses = await prisma.expense.findMany({
          where: {
            budgetId: expense.budgetId,
            categoryId: expense.categoryId,
            status: "APPROVED",
          },
        });

        const totalApprovedAmount = approvedExpenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );

        // Get the category allocation from budget categories
        const budgetCategory = await prisma.budgetCategory.findFirst({
          where: {
            budgetId: expense.budgetId,
            categoryId: expense.categoryId,
          },
        });

        if (budgetCategory) {
          const categoryLimit = budgetCategory.amount;
          const newTotal = totalApprovedAmount + expense.amount;

          if (newTotal > categoryLimit) {
            return res.status(400).json({
              error: "Approval would exceed category budget",
              details: {
                categoryName: expense.category?.name || "Uncategorized",
                allocated: categoryLimit,
                spent: totalApprovedAmount,
                remaining: categoryLimit - totalApprovedAmount,
                expenseAmount: expense.amount,
              },
            });
          }
        }
      }

      // Update the expense status
      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: { status },
        include: {
          budget: {
            include: {
              startupCall: {
                select: { title: true },
              },
            },
          },
          category: true,
        },
      });

      return res.status(200).json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense status:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE - Delete an expense
  else if (req.method === "DELETE") {
    try {
      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      await prisma.expense.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Unsupported method
  else {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
