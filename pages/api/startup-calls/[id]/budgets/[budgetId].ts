import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const startupCallId = req.query.id as string;
  const budgetId = req.query.budgetId as string;

  // Check if budget exists and belongs to the startup call
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      startupCallId,
    },
  });

  if (!budget) {
    return res.status(404).json({ error: "Budget not found" });
  }

  // Handle GET request - get budget details
  if (req.method === "GET") {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          categories: true,
          expenses: {
            include: {
              category: true,
            },
          },
        },
      });

      return res.status(200).json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      return res.status(500).json({ error: "Error fetching budget" });
    }
  }

  // Handle PUT request - update a budget
  if (req.method === "PUT") {
    try {
      const {
        title,
        description,
        totalAmount,
        currency,
        fiscalYear,
        status,
        categories,
      } = req.body;

      // Update budget with categories in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Update the budget
        const updatedBudget = await prisma.budget.update({
          where: { id: budgetId },
          data: {
            title,
            description,
            totalAmount,
            currency,
            fiscalYear,
            status,
          },
        });

        // Update categories if provided
        if (categories && Array.isArray(categories)) {
          // Get existing categories
          const existingCategories = await prisma.budgetCategory.findMany({
            where: { budgetId },
          });

          // Create a map of existing categories by ID
          const existingCategoryMap = new Map(
            existingCategories.map((cat) => [cat.id, cat])
          );

          // Process each category from the request
          for (const category of categories) {
            if (category.id && existingCategoryMap.has(category.id)) {
              // Update existing category
              await prisma.budgetCategory.update({
                where: { id: category.id },
                data: {
                  name: category.name,
                  description: category.description,
                  allocatedAmount: category.allocatedAmount,
                },
              });
              // Remove from map to track which ones were processed
              existingCategoryMap.delete(category.id);
            } else {
              // Create new category
              await prisma.budgetCategory.create({
                data: {
                  name: category.name,
                  description: category.description,
                  allocatedAmount: category.allocatedAmount,
                  budget: {
                    connect: { id: budgetId },
                  },
                },
              });
            }
          }

          // Delete categories that weren't in the request
          for (const [catId] of existingCategoryMap) {
            await prisma.budgetCategory.delete({
              where: { id: catId },
            });
          }
        }

        // Return the updated budget with categories
        return prisma.budget.findUnique({
          where: { id: budgetId },
          include: {
            categories: true,
          },
        });
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating budget:", error);
      return res.status(500).json({ error: "Error updating budget" });
    }
  }

  // Handle DELETE request - delete a budget
  if (req.method === "DELETE") {
    try {
      // Delete budget and all related categories and expenses in a transaction
      await prisma.$transaction(async (prisma) => {
        // Delete expenses associated with this budget
        await prisma.expense.deleteMany({
          where: { budgetId },
        });

        // Delete categories associated with this budget
        await prisma.budgetCategory.deleteMany({
          where: { budgetId },
        });

        // Delete the budget
        await prisma.budget.delete({
          where: { id: budgetId },
        });
      });

      return res.status(200).json({ message: "Budget deleted successfully" });
    } catch (error) {
      console.error("Error deleting budget:", error);
      return res.status(500).json({ error: "Error deleting budget" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
