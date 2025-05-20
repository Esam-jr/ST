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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: startupCallId, budgetId, expenseId } = req.query;

  // Verify the expense exists and belongs to the specified budget
  try {
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId as string,
      },
      include: {
        budget: true,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.budgetId !== budgetId) {
      return res.status(400).json({
        error: "Expense does not belong to the specified budget",
      });
    }

    if (expense.budget.startupCallId !== startupCallId) {
      return res.status(400).json({
        error: "Budget does not belong to the specified startup call",
      });
    }
  } catch (error) {
    console.error("Error verifying expense:", error);
    return res.status(500).json({ error: "Failed to verify expense" });
  }

  // GET: Fetch a specific expense
  if (req.method === "GET") {
    try {
      const expense = await prisma.expense.findUnique({
        where: {
          id: expenseId as string,
        },
      });

      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      return res.status(200).json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      return res.status(500).json({ error: "Failed to fetch expense" });
    }
  }

  // PUT: Update an expense with receipt upload support
  if (req.method === "PUT") {
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

      // Get current expense to check for existing receipt
      const currentExpense = await prisma.expense.findUnique({
        where: { id: expenseId as string },
        select: { receipt: true },
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

      // Process receipt file if present
      let receiptPath = currentExpense?.receipt || null;
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

        // Delete old receipt file if it exists
        if (currentExpense?.receipt) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            currentExpense.receipt.replace(/^\//, "")
          );

          try {
            if (fs.existsSync(oldFilePath)) {
              await fs.promises.unlink(oldFilePath);
            }
          } catch (deleteError) {
            console.error("Error deleting old receipt file:", deleteError);
            // Continue even if old file deletion fails
          }
        }

        // Set the receipt path to be stored in the database
        receiptPath = `/uploads/${uniqueFilename}`;
      }

      // Add receipt path to expense data if a file was uploaded or if it should be kept
      if (receiptPath) {
        expenseData.receipt = receiptPath;
      } else if (fields.removeReceipt && fields.removeReceipt[0] === "true") {
        // Remove receipt if explicitly requested
        expenseData.receipt = null;

        // Delete the file if it exists
        if (currentExpense?.receipt) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            currentExpense.receipt.replace(/^\//, "")
          );

          try {
            if (fs.existsSync(oldFilePath)) {
              await fs.promises.unlink(oldFilePath);
            }
          } catch (deleteError) {
            console.error("Error deleting receipt file:", deleteError);
            // Continue even if file deletion fails
          }
        }
      }

      // Update the expense in the database
      const expense = await prisma.expense.update({
        where: {
          id: expenseId as string,
        },
        data: expenseData,
      });

      return res.status(200).json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      return res.status(500).json({ error: "Failed to update expense" });
    }
  }

  // DELETE: Delete an expense
  if (req.method === "DELETE") {
    try {
      // Get current expense to check for existing receipt
      const currentExpense = await prisma.expense.findUnique({
        where: { id: expenseId as string },
        select: { receipt: true },
      });

      // Delete receipt file if it exists
      if (currentExpense?.receipt) {
        const filePath = path.join(
          process.cwd(),
          "public",
          currentExpense.receipt.replace(/^\//, "")
        );

        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } catch (deleteError) {
          console.error("Error deleting receipt file:", deleteError);
          // Continue even if file deletion fails
        }
      }

      // Delete the expense from the database
      await prisma.expense.delete({
        where: {
          id: expenseId as string,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      return res.status(500).json({ error: "Failed to delete expense" });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
