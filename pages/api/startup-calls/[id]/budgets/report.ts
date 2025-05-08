import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { format } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
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
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  try {
    const { id: startupCallId } = req.query;
    const { budgetId, dateFrom, dateTo, timeframe } = req.body;

    // Validate startup call
    const startupCall = await prisma.startupCall.findUnique({
      where: { id: startupCallId as string },
    });

    if (!startupCall) {
      return res.status(404).json({ error: "Startup call not found" });
    }

    // Query budgets for the startup call
    let budgets;
    if (budgetId) {
      // Single budget
      budgets = await prisma.budget.findMany({
        where: {
          id: budgetId as string,
          startupCallId: startupCallId as string,
        },
        include: {
          categories: true,
          expenses: {
            include: {
              category: true,
            },
            where:
              dateFrom || dateTo
                ? {
                    date: {
                      ...(dateFrom && { gte: new Date(dateFrom) }),
                      ...(dateTo && { lte: new Date(dateTo) }),
                    },
                  }
                : undefined,
          },
        },
      });
    } else {
      // All budgets for startup call
      budgets = await prisma.budget.findMany({
        where: {
          startupCallId: startupCallId as string,
        },
        include: {
          categories: true,
          expenses: {
            include: {
              category: true,
            },
            where:
              dateFrom || dateTo
                ? {
                    date: {
                      ...(dateFrom && { gte: new Date(dateFrom) }),
                      ...(dateTo && { lte: new Date(dateTo) }),
                    },
                  }
                : undefined,
          },
        },
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=budget_report_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    // Add report header
    doc.fontSize(25).text("Budget Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(14)
      .text(`Startup Call: ${startupCall.title}`, { align: "center" });
    doc.moveDown();

    // Add date range if provided
    if (dateFrom || dateTo) {
      const dateRangeText = `Period: ${
        dateFrom ? format(new Date(dateFrom), "MMM dd, yyyy") : "Start"
      } to ${dateTo ? format(new Date(dateTo), "MMM dd, yyyy") : "Present"}`;
      doc.fontSize(12).text(dateRangeText, { align: "center" });
      doc.moveDown();
    }

    doc
      .fontSize(12)
      .text(`Generated on: ${format(new Date(), "MMM dd, yyyy")}`, {
        align: "center",
      });
    doc.moveDown(2);

    // Add budgets summary
    doc.fontSize(16).text("Budget Summary", { underline: true });
    doc.moveDown();

    if (budgets.length === 0) {
      doc.text("No budgets found for this startup call.");
    } else {
      // Display total budget and expenses
      const totalBudget = budgets.reduce(
        (sum, budget) => sum + budget.totalAmount,
        0
      );
      const totalExpenses = budgets.reduce(
        (sum, budget) =>
          sum + budget.expenses.reduce((expSum, exp) => expSum + exp.amount, 0),
        0
      );
      const remaining = totalBudget - totalExpenses;
      const utilizationPercentage =
        totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

      doc.fontSize(12).text(`Total Budget: $${totalBudget.toFixed(2)}`);
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
      doc.text(`Remaining: $${remaining.toFixed(2)}`);
      doc.text(`Utilization: ${utilizationPercentage.toFixed(2)}%`);
      doc.moveDown(2);

      // Add individual budget details
      doc.fontSize(16).text("Budget Details", { underline: true });
      doc.moveDown();

      budgets.forEach((budget, index) => {
        const budgetExpenses = budget.expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
        const budgetRemaining = budget.totalAmount - budgetExpenses;
        const budgetUtilization =
          budget.totalAmount > 0
            ? (budgetExpenses / budget.totalAmount) * 100
            : 0;

        doc.fontSize(14).text(`${index + 1}. ${budget.title}`);
        doc
          .fontSize(12)
          .text(
            `Total: $${budget.totalAmount.toFixed(2)} (${budget.currency})`
          );
        doc.text(`Fiscal Year: ${budget.fiscalYear}`);
        doc.text(`Status: ${budget.status}`);
        doc.text(`Expenses: $${budgetExpenses.toFixed(2)}`);
        doc.text(`Remaining: $${budgetRemaining.toFixed(2)}`);
        doc.text(`Utilization: ${budgetUtilization.toFixed(2)}%`);
        doc.moveDown();

        // Add budget categories
        if (budget.categories.length > 0) {
          doc.text("Categories:", { underline: true });

          // Draw table headers
          const categoryTableTop = doc.y + 10;
          const categoryTableHeaders = [
            "Category",
            "Allocated",
            "Spent",
            "Remaining",
            "% Used",
          ];
          const categoryColumnWidths = [200, 70, 70, 70, 50];

          let categoryY = categoryTableTop;

          // Draw headers
          doc.font("Helvetica-Bold");
          categoryTableHeaders.forEach((header, i) => {
            let x = 50;
            for (let j = 0; j < i; j++) {
              x += categoryColumnWidths[j];
            }
            doc.text(header, x, categoryY);
          });
          doc.font("Helvetica");

          categoryY += 20;

          // Calculate expenses by category
          const categoryExpenses: { [key: string]: number } = {};
          budget.expenses.forEach((expense) => {
            if (expense.categoryId) {
              if (categoryExpenses[expense.categoryId]) {
                categoryExpenses[expense.categoryId] += expense.amount;
              } else {
                categoryExpenses[expense.categoryId] = expense.amount;
              }
            }
          });

          // Draw category data
          budget.categories.forEach((category) => {
            const spent = categoryExpenses[category.id] || 0;
            const remaining = category.allocatedAmount - spent;
            const percentUsed =
              category.allocatedAmount > 0
                ? (spent / category.allocatedAmount) * 100
                : 0;

            const categoryRow = [
              category.name,
              `$${category.allocatedAmount.toFixed(2)}`,
              `$${spent.toFixed(2)}`,
              `$${remaining.toFixed(2)}`,
              `${percentUsed.toFixed(1)}%`,
            ];

            categoryRow.forEach((cell, i) => {
              let x = 50;
              for (let j = 0; j < i; j++) {
                x += categoryColumnWidths[j];
              }
              doc.text(cell, x, categoryY);
            });

            categoryY += 20;
          });

          doc.y = categoryY + 10;
        }

        // Add expenses if there are any
        if (budget.expenses.length > 0) {
          doc.moveDown();
          doc.text("Recent Expenses:", { underline: true });

          // Draw table headers
          const expenseTableTop = doc.y + 10;
          const expenseTableHeaders = [
            "Date",
            "Title",
            "Category",
            "Amount",
            "Status",
          ];
          const expenseColumnWidths = [80, 150, 100, 70, 70];

          let expenseY = expenseTableTop;

          // Draw headers
          doc.font("Helvetica-Bold");
          expenseTableHeaders.forEach((header, i) => {
            let x = 50;
            for (let j = 0; j < i; j++) {
              x += expenseColumnWidths[j];
            }
            doc.text(header, x, expenseY);
          });
          doc.font("Helvetica");

          expenseY += 20;

          // Sort expenses by date (newest first) and limit to 10
          const recentExpenses = [...budget.expenses]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .slice(0, 10);

          // Draw expense data
          recentExpenses.forEach((expense) => {
            const expenseRow = [
              format(new Date(expense.date), "MMM dd, yyyy"),
              expense.title.substring(0, 25) +
                (expense.title.length > 25 ? "..." : ""),
              expense.category ? expense.category.name : "Uncategorized",
              `$${expense.amount.toFixed(2)}`,
              expense.status,
            ];

            expenseRow.forEach((cell, i) => {
              let x = 50;
              for (let j = 0; j < i; j++) {
                x += expenseColumnWidths[j];
              }
              doc.text(cell, x, expenseY);
            });

            expenseY += 20;

            // Add a new page if we're near the bottom
            if (expenseY > 700) {
              doc.addPage();
              expenseY = 50;
            }
          });

          doc.y = expenseY + 10;
        }

        // Add a new page for the next budget if not the last one
        if (index < budgets.length - 1) {
          doc.addPage();
        }
      });
    }

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating budget report:", error);
    return res.status(500).json({ error: "Failed to generate budget report" });
  }
}
