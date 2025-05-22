import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { validateExpense } from "@/lib/validation";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Disable the default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Handler for budget expenses operations
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: startupCallId, budgetId } = req.query;

  // Get the user id from the session
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: { id: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  // Verify the startup call and budget exist
  try {
    const budget = await prisma.budget.findUnique({
      where: {
        id: budgetId as string,
      },
      include: {
        startupCall: true,
      },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    if (budget.startupCallId !== startupCallId) {
      return res.status(400).json({
        error: "Budget does not belong to the specified startup call",
      });
    }
  } catch (error) {
    console.error("Error verifying budget:", error);
    return res.status(500).json({ error: "Failed to verify budget" });
  }

  // GET: Fetch all expenses for a budget
  if (req.method === "GET") {
    try {
      const expenses = await prisma.expense.findMany({
        where: {
          budgetId: budgetId as string,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return res.status(200).json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }

  // POST: Create a new expense
  if (req.method === "POST") {
    try {
      const form = new formidable.IncomingForm();
      
      const parseForm = () => {
        return new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
          });
        });
      };
      
      const { fields, files } = await parseForm() as any;
      
      // Extract and validate data
      const title = fields.title?.[0] || fields.title;
      const description = fields.description?.[0] || fields.description || '';
      const amount = parseFloat(fields.amount?.[0] || fields.amount || '0');
      const currency = fields.currency?.[0] || fields.currency || 'USD';
      const date = fields.date?.[0] || fields.date;
      const categoryId = fields.categoryId?.[0] || fields.categoryId;
      const status = fields.status?.[0] || fields.status || "PENDING";
      const providedUserId = fields.userId?.[0] || fields.userId;
      
      // Use the validation utility
      const validation = validateExpense({
        title,
        description,
        amount,
        currency,
        date,
      });
      
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: validation.error,
          details: validation.details
        });
      }
      
      // Process receipt file if exists
      let receiptPath = null;
      const receiptFile = files.receipt as formidable.File;
      
      if (receiptFile) {
        try {
          const fileExtension = path.extname(receiptFile.originalFilename || '');
          const fileName = `${uuidv4()}${fileExtension}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          
          // Ensure uploads directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const newPath = path.join(uploadDir, fileName);
          
          // Copy file to uploads directory
          const rawData = fs.readFileSync(receiptFile.filepath);
          fs.writeFileSync(newPath, rawData);
          
          // Set path for database
          receiptPath = `/uploads/${fileName}`;
        } catch (fileError) {
          console.error('Error processing receipt file:', fileError);
        }
      }
      
      // Determine the userId to use - provided or current user
      const expenseUserId = providedUserId || user.id;
      
      // If userId is provided, verify it exists
      if (providedUserId && providedUserId !== user.id) {
        const userExists = await prisma.user.findUnique({
          where: { id: providedUserId },
          select: { id: true }
        });
        
        if (!userExists) {
          return res.status(400).json({ 
            error: "Invalid user ID", 
            details: "The specified user does not exist" 
          });
        }
      }

      // Create the expense
      const expense = await prisma.expense.create({
        data: {
          title: validation.data.title,
          description: validation.data.description,
          amount: validation.data.amount,
          currency: validation.data.currency,
          date: validation.data.date,
          status,
          receipt: receiptPath,
          userId: expenseUserId,
          budgetId: budgetId as string,
          categoryId: categoryId || null,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({
        error: "Failed to create expense",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
