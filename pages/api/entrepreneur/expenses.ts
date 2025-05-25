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
      const startupId = Array.isArray(req.query.startupId) 
        ? req.query.startupId[0] 
        : req.query.startupId;

      if (!startupId) {
        return res.status(400).json({ message: "startupId is required" });
      }

      const startup = await prisma.startup.findFirst({
        where: {
          id: startupId,
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
      const startupId = Array.isArray(fields.startupId) 
        ? fields.startupId[0] 
        : fields.startupId;

      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
      const amount = Array.isArray(fields.amount) ? fields.amount[0] : fields.amount;
      const date = Array.isArray(fields.date) ? fields.date[0] : fields.date;
      const categoryId = Array.isArray(fields.categoryId) ? fields.categoryId[0] : fields.categoryId;
      const milestoneId = Array.isArray(fields.milestoneId) ? fields.milestoneId[0] : fields.milestoneId;

      if (!title || !amount || !date || !categoryId || !milestoneId || !startupId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find the startup and validate ownership
      const startup = await prisma.startup.findFirst({
        where: {
          id: startupId,
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
              id: milestoneId,
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
          categoryId: categoryId,
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
          title,
          description: description || "",
          amount: Number(amount),
          date: new Date(date),
          status: "PENDING",
          receipt: files.receipt ? files.receipt[0].filepath : null,
          user: {
            connect: {
              id: session.user.id,
            },
          },
          startup: {
            connect: {
              id: startupId,
            },
          },
          category: {
            connect: {
              id: categoryId,
            },
          },
          milestone: {
            connect: {
              id: milestoneId,
            },
          },
          budget: {
            connect: {
              id: startup.budget!.id,
            },
          },
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          milestone: {
            select: {
              title: true,
            },
          },
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
