import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }

  // Handle GET request for expenses
  if (req.method === "GET") {
    try {
      // Extract query parameters
      const { startupCallId, status, startupId } = req.query;

      // Build filter conditions
      const whereConditions: any = {};

      if (startupCallId) {
        whereConditions.startupCallId = startupCallId as string;
      }

      if (status) {
        whereConditions.status = status as string;
      }

      if (startupId) {
        whereConditions.startupId = startupId as string;
      }

      // Fetch expenses with related data
      const expenses = await prisma.expense.findMany({
        where: whereConditions,
        include: {
          startupCall: {
            select: {
              id: true,
              title: true,
            },
          },
          startup: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Fetch startup calls for filtering
      const startupCalls = await prisma.startupCall.findMany({
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          startDate: "desc",
        },
      });

      // Transform expenses to include category name
      const transformedExpenses = expenses.map((expense) => ({
        ...expense,
        categoryName: expense.category?.name || "Uncategorized",
        receipt: expense.receipt
          ? expense.receipt.startsWith("http")
            ? expense.receipt
            : `${process.env.NEXTAUTH_URL || ""}${expense.receipt}`
          : null,
      }));

      return res.status(200).json({
        expenses: transformedExpenses,
        startupCalls,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle expense approval/rejection
  if (req.method === "PATCH") {
    try {
      const { id, status, rejectionReason } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate status
      if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Update expense status
      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
        },
      });

      return res.status(200).json({
        message: `Expense ${status.toLowerCase()} successfully`,
        expense: updatedExpense,
      });
    } catch (error) {
      console.error("Error updating expense:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
}
