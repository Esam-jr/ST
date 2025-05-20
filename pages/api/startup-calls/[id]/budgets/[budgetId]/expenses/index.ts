import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
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

  // POST: Create a new expense with receipt upload support
  if (req.method === "POST") {
    try {
      // Parse form data with file upload
      const form = formidable({
        maxFiles: 1,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        keepExtensions: true,
        filter: (part) => {
          // Only allow receipt files
          if (part.name === "receipt" && part.mimetype) {
            return (
              part.mimetype.includes("image/jpeg") ||
              part.mimetype.includes("image/png") ||
              part.mimetype.includes("application/pdf")
            );
          }
          return true; // Allow all other fields
        },
      });

      // Parse the form
      const [fields, files] = await new Promise<
        [formidable.Fields, formidable.Files]
      >((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      // Extract expense data from fields
      const expenseData: any = {};

      // Process all form fields
      Object.keys(fields).forEach((key) => {
        const value = fields[key]?.[0];
        if (value !== undefined) {
          // Convert numeric values
          if (key === "amount") {
            expenseData[key] = parseFloat(value);
          } else {
            expenseData[key] = value;
          }
        }
      });

      // Set budget ID
      expenseData.budgetId = budgetId as string;

      // Process receipt file if present
      let receiptPath = null;
      const receiptFile = files.receipt?.[0];

      if (receiptFile) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueFilename = `${uuidv4()}-${receiptFile.originalFilename}`;
        const newPath = path.join(uploadsDir, uniqueFilename);

        // Move the file from temp location to uploads directory
        await fs.promises.copyFile(receiptFile.filepath, newPath);

        // Clean up the temp file
        await fs.promises.unlink(receiptFile.filepath);

        // Set the receipt path to be stored in the database
        receiptPath = `/uploads/${uniqueFilename}`;
      }

      // Add receipt path to expense data if a file was uploaded
      if (receiptPath) {
        expenseData.receipt = receiptPath;
      }

      // Add user ID as creator
      expenseData.createdById = session.user.id;

      // Create the expense in the database
      const expense = await prisma.expense.create({
        data: expenseData,
      });

      return res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Failed to create expense" });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
