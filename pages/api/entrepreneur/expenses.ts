import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { parseForm } from "@/lib/parse-form";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // GET method to fetch expenses
    if (req.method === "GET") {
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
        include: {
          expenses: {
            include: {
              category: true,
              milestone: true,
            },
            orderBy: {
              date: "desc",
            },
          },
          budget: {
            include: {
              categories: true,
            },
          },
        },
      });

      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }

      // Transform the data for the frontend
      const expenses = startup.expenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        status: expense.status,
        categoryId: expense.categoryId,
        categoryName: expense.category.name,
        milestoneId: expense.milestoneId,
        milestoneTitle: expense.milestone?.title,
        receipt: expense.receipt,
      }));

      const categories = startup.budget?.categories.map((category) => {
        const categoryExpenses = startup.expenses.filter(
          (e) => e.categoryId === category.id
        );
        const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          id: category.id,
          name: category.name,
          allocatedAmount: category.allocatedAmount,
          spent,
          remaining: category.allocatedAmount - spent,
        };
      }) || [];

      return res.status(200).json({
        expenses,
        categories,
        budget: startup.budget,
      });
    }

    // POST method to create expense
    if (req.method === "POST") {
      const { fields, files } = await parseForm(req);

      const {
        title,
        description,
        amount,
        date,
        categoryId,
        milestoneId,
      } = fields;

      if (!title || !amount || !date || !categoryId || !milestoneId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find the startup and validate ownership
      const startup = await prisma.startup.findFirst({
        where: {
          founderId: session.user.id,
        },
        include: {
          budget: {
            include: {
              categories: true,
            },
          },
          milestones: {
            where: {
              id: milestoneId as string,
            },
          },
        },
      });

      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }

      // Validate milestone
      if (!startup.milestones.length) {
        return res.status(400).json({ message: "Invalid milestone" });
      }

      // Validate category and budget
      const category = startup.budget?.categories.find(
        (c) => c.id === categoryId
      );
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }

      // Calculate remaining budget
      const categoryExpenses = await prisma.expense.findMany({
        where: {
          categoryId: categoryId as string,
          startupId: startup.id,
        },
      });
      const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const remaining = category.allocatedAmount - spent;

      if (Number(amount) > remaining) {
        return res.status(400).json({
          message: `Amount exceeds remaining budget for this category (${remaining})`,
        });
      }

      // Create the expense
      const expense = await prisma.expense.create({
        data: {
          title: title as string,
          description: description as string || "",
          amount: Number(amount),
          date: new Date(date as string),
          status: "PENDING",
          receipt: files.receipt ? files.receipt.filepath : null,
          startup: {
            connect: {
              id: startup.id,
            },
          },
          category: {
            connect: {
              id: categoryId as string,
            },
          },
          milestone: {
            connect: {
              id: milestoneId as string,
            },
          },
        },
        include: {
          category: true,
          milestone: true,
        },
      });

      return res.status(201).json({
        ...expense,
        categoryName: expense.category.name,
        milestoneTitle: expense.milestone.title,
      });
    }
  } catch (error) {
    console.error("Error handling expense:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
