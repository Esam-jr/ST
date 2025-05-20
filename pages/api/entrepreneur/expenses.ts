import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse form data with formidable
const parseForm = (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const form = formidable({
        multiples: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        uploadDir: path.join(process.cwd(), "public/uploads/receipts"),
        keepExtensions: true,
        filename: (_name, _ext, part) => {
          const uniqueFilename = `${uuidv4()}${path.extname(
            part.originalFilename || ""
          )}`;
          return uniqueFilename;
        },
      });

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), "public/uploads/receipts");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || session.user.role !== "ENTREPRENEUR") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Handle GET request - list expenses
    if (req.method === "GET") {
      try {
        // First, find the entrepreneur's startup
        const startup = await prisma.startup.findFirst({
          where: {
            founderId: session.user.id,
          },
        });

        if (!startup) {
          return res
            .status(404)
            .json({ message: "No startup found for this user" });
        }

        // Find the approved application
        const approvedApplication =
          await prisma.startupCallApplication.findFirst({
            where: {
              startupId: startup.id,
              status: "APPROVED",
            },
            include: {
              startupCall: {
                include: {
                  budget: true,
                },
              },
            },
          });

        if (!approvedApplication || !approvedApplication.startupCall.budget) {
          return res
            .status(404)
            .json({ message: "No approved application or budget found" });
        }

        // Get budget ID from the approved application
        const budgetId = approvedApplication.startupCall.budget.id;

        // Get expenses for this budget
        const expenses = await prisma.expense.findMany({
          where: {
            budgetId: budgetId,
            createdById: session.user.id,
          },
          include: {
            category: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Format the receipt URL for each expense
        const formattedExpenses = expenses.map((expense) => ({
          ...expense,
          receipt: expense.receipt
            ? expense.receipt.startsWith("http")
              ? expense.receipt
              : `${process.env.NEXTAUTH_URL || ""}${expense.receipt}`
            : null,
        }));

        // Get expense categories
        const categories = await prisma.expenseCategory.findMany({
          where: {
            budgetId: budgetId,
          },
          orderBy: {
            name: "asc",
          },
        });

        return res.status(200).json({
          expenses: formattedExpenses,
          categories,
          budget: approvedApplication.startupCall.budget,
        });
      } catch (error) {
        console.error("Error fetching expenses:", error);
        return res.status(500).json({
          message: "Failed to fetch expenses. Please try again later.",
          error:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        });
      }
    }

    // Handle POST request - create new expense
    if (req.method === "POST") {
      try {
        const { fields, files } = await parseForm(req);

        // Validate the form data
        const title = fields.title?.[0];
        const description = fields.description?.[0] || null;
        const amountStr = fields.amount?.[0];
        const categoryId = fields.categoryId?.[0] || null;
        const date = fields.date?.[0] ? new Date(fields.date[0]) : new Date();
        const currency = fields.currency?.[0] || "USD";
        const budgetId = fields.budgetId?.[0];

        if (!title || !amountStr || !budgetId) {
          return res.status(400).json({
            message: "Missing required fields",
            code: "VALIDATION_ERROR",
          });
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          return res.status(400).json({
            message: "Invalid amount",
            code: "VALIDATION_ERROR",
          });
        }

        // Get file path of receipt
        let receiptPath = null;
        if (files.receipt) {
          const file = Array.isArray(files.receipt)
            ? files.receipt[0]
            : files.receipt;
          const relativePath = `/uploads/receipts/${path.basename(
            file.filepath
          )}`;
          receiptPath = relativePath;
        }

        // Create the expense
        try {
          const expense = await prisma.expense.create({
            data: {
              title,
              description,
              amount,
              date,
              currency,
              receipt: receiptPath,
              status: "PENDING",
              createdById: session.user.id,
              budgetId,
              categoryId,
            },
          });

          return res.status(201).json({
            message: "Expense created successfully",
            expense: {
              ...expense,
              receipt: expense.receipt
                ? expense.receipt.startsWith("http")
                  ? expense.receipt
                  : `${process.env.NEXTAUTH_URL || ""}${expense.receipt}`
                : null,
            },
          });
        } catch (error: any) {
          console.error("Database error creating expense:", error);
          if (error.code === "P2002") {
            return res.status(409).json({
              message: "Duplicate expense entry",
              code: "DUPLICATE_ERROR",
            });
          }

          return res.status(500).json({
            message: "Failed to create expense due to a database error",
            code: "TRANSACTION_ERROR",
            details:
              process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
          });
        }
      } catch (error: any) {
        console.error("Error creating expense:", error);

        return res.status(500).json({
          message: "Failed to create expense. Please try again later.",
          code: "SERVER_ERROR",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }

    // Handle unsupported methods
    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Unhandled error in API route:", error);
    return res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
}
