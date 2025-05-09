// Direct PostgreSQL client for seeding
const { Client } = require("pg");
const { randomUUID } = require("crypto");
require("dotenv").config();

// Generate a cuid-like ID
function generateId() {
  return (
    "c" + Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
  );
}

async function main() {
  console.log("Starting direct Postgres seeding...");

  // Create a new client connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to PostgreSQL database");

    // Find admin user
    console.log("Looking for admin user...");
    const adminResult = await client.query(
      'SELECT id, email FROM "User" WHERE role = $1 LIMIT 1',
      ["ADMIN"]
    );

    if (adminResult.rows.length === 0) {
      throw new Error(
        "No admin user found. Please run the main seed script first."
      );
    }

    const adminUser = adminResult.rows[0];
    console.log(`Using admin user with ID: ${adminUser.id}`);

    // Find startup call
    console.log("Looking for startup call...");
    const callResult = await client.query(
      'SELECT id, title FROM "StartupCall" WHERE status = $1 LIMIT 1',
      ["PUBLISHED"]
    );

    if (callResult.rows.length === 0) {
      throw new Error(
        "No published startup call found. Please create one first."
      );
    }

    const startupCall = callResult.rows[0];
    console.log(
      `Using startup call: ${startupCall.title} (ID: ${startupCall.id})`
    );

    // Create budget with generated ID
    const budgetId = generateId();
    console.log("Creating budget...");
    const budgetResult = await client.query(
      `INSERT INTO "Budget" (
        id,
        title, 
        description, 
        "totalAmount", 
        currency,
        "fiscalYear",
        status,
        "startupCallId", 
        "createdAt", 
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id, title`,
      [
        budgetId,
        "Direct Postgres Budget",
        "Budget created using direct Postgres connection",
        125000,
        "USD",
        "2024",
        "active",
        startupCall.id,
      ]
    );

    const budget = budgetResult.rows[0];
    console.log(`Created budget with ID: ${budget.id}`);

    // Create budget category with generated ID
    const categoryId = generateId();
    console.log("Creating budget category...");
    const categoryResult = await client.query(
      `INSERT INTO "BudgetCategory" (
        id,
        name, 
        description, 
        "allocatedAmount", 
        "budgetId", 
        "createdAt", 
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name`,
      [
        categoryId,
        "Technology",
        "Technology and equipment expenses",
        45000,
        budget.id,
      ]
    );

    const category = categoryResult.rows[0];
    console.log(`Created budget category with ID: ${category.id}`);

    // Create expense with generated ID
    const expenseId = generateId();
    console.log("Creating expense...");
    const expenseResult = await client.query(
      `INSERT INTO "Expense" (
        id,
        title, 
        description, 
        amount, 
        currency, 
        date, 
        status, 
        "budgetId",
        "categoryId",
        "createdAt", 
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id, title`,
      [
        expenseId,
        "Software Licenses",
        "Annual software license purchases",
        18500,
        "USD",
        new Date(),
        "approved",
        budget.id,
        category.id,
      ]
    );

    const expense = expenseResult.rows[0];
    console.log(`Created expense with ID: ${expense.id}`);

    console.log("Budget data seeded successfully!");
  } catch (error) {
    console.error("Error in seeding process:", error);
  } finally {
    // Close the client connection
    await client.end();
    console.log("Database connection closed");
  }
}

main()
  .then(() => console.log("Budget data seeding completed."))
  .catch((error) => {
    console.error("Error during seeding budget data:", error);
    process.exit(1);
  });
