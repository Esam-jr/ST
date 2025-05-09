const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to retry operations that fail due to prepared statement errors
async function withRetry(operation, maxRetries = 3) {
  let retries = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if it's a prepared statement error
      const isPreparedStatementError =
        error.message &&
        (error.message.includes("prepared statement") ||
          error.message.includes("statement does not exist") ||
          error.code === "42P05");

      if (isPreparedStatementError && retries < maxRetries) {
        console.log(
          `Prepared statement error, retrying (${retries + 1}/${maxRetries})...`
        );
        retries++;

        // Try to reset connection
        try {
          await prisma.$disconnect();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (innerError) {
          console.error("Error resetting connection:", innerError);
        }

        continue;
      }

      // If it's not a prepared statement error or we've exceeded retries, rethrow
      throw error;
    }
  }
}

async function main() {
  console.log("Starting budget seeding with raw queries...");

  try {
    // Find the first admin user using raw query
    console.log("Looking for admin user...");
    const adminUsers =
      await prisma.$queryRaw`SELECT id, email FROM "User" WHERE role = 'ADMIN' LIMIT 1`;

    if (!adminUsers || adminUsers.length === 0) {
      console.error(
        "No admin user found. Please run the main seed script first."
      );
      return;
    }

    const adminUser = adminUsers[0];
    console.log(`Found admin user with ID: ${adminUser.id}`);

    // Find an existing published startup call
    console.log("Looking for published startup call...");
    const startupCalls = await prisma.$queryRaw`
      SELECT id, title FROM "StartupCall" 
      WHERE status = 'PUBLISHED' 
      LIMIT 1
    `;

    if (!startupCalls || startupCalls.length === 0) {
      console.error(
        "No published startup call found. Please create one first."
      );
      return;
    }

    const startupCall = startupCalls[0];
    console.log(
      `Using startup call: ${startupCall.title} (ID: ${startupCall.id})`
    );

    // Create a budget using raw query
    console.log("Creating budget...");
    const budgetTitle = "Sample Raw Budget";
    const budgetDesc = "Budget created using raw queries";
    const totalAmount = 100000;

    const budgets = await prisma.$queryRaw`
      INSERT INTO "Budget" (
        title, 
        description, 
        "totalAmount", 
        currency, 
        "startupCallId", 
        "createdById", 
        "createdAt", 
        "updatedAt"
      ) 
      VALUES (
        ${budgetTitle}, 
        ${budgetDesc}, 
        ${totalAmount}, 
        'USD', 
        ${startupCall.id}, 
        ${adminUser.id}, 
        NOW(), 
        NOW()
      )
      RETURNING id, title
    `;

    const budget = budgets[0];
    console.log(`Created budget with ID: ${budget.id}`);

    // Create a budget category
    console.log("Creating budget category...");
    const categoryTitle = "Raw Marketing";
    const categoryDesc = "Marketing expenses created with raw queries";
    const allocatedAmount = 35000;

    const categories = await prisma.$queryRaw`
      INSERT INTO "BudgetCategory" (
        title, 
        description, 
        "allocatedAmount", 
        "budgetId", 
        "createdAt", 
        "updatedAt"
      ) 
      VALUES (
        ${categoryTitle}, 
        ${categoryDesc}, 
        ${allocatedAmount}, 
        ${budget.id}, 
        NOW(), 
        NOW()
      )
      RETURNING id, title
    `;

    const category = categories[0];
    console.log(`Created category with ID: ${category.id}`);

    // Create an expense
    console.log("Creating expense...");
    const expenseTitle = "Sample Raw Expense";
    const expenseDesc = "Expense created with raw queries";
    const expenseAmount = 12500;
    const expenseDate = new Date().toISOString();

    const expenses = await prisma.$queryRaw`
      INSERT INTO "Expense" (
        title, 
        description, 
        amount, 
        currency, 
        date, 
        status, 
        "budgetCategoryId", 
        "createdById", 
        "createdAt", 
        "updatedAt"
      ) 
      VALUES (
        ${expenseTitle}, 
        ${expenseDesc}, 
        ${expenseAmount}, 
        'USD', 
        ${expenseDate}::timestamp, 
        'APPROVED', 
        ${category.id}, 
        ${adminUser.id}, 
        NOW(), 
        NOW()
      )
      RETURNING id, title
    `;

    const expense = expenses[0];
    console.log(`Created expense with ID: ${expense.id}`);

    console.log("Budget data seeded successfully!");
  } catch (error) {
    console.error("Error in seeding process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log("Budget data seeding completed."))
  .catch((error) => {
    console.error("Error during seeding budget data:", error);
    process.exit(1);
  });
