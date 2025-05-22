import { PrismaClient, Role } from "@prisma/client";
import * as bcryptjs from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a PrismaClient instance with debug logging
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// Create a hash function reference for cleaner code
const hash = bcryptjs.hash;

/**
 * Main seeding function that handles database initialization
 */
async function main() {
  console.log("Starting unified database seeding process...");

  try {
    // Clear the database first to avoid duplicates
    await clearDatabase();

    // First, seed users and basic entities
    await seedBasicEntities();

    // Then seed budget-related data
    await seedBudgetData();

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Seeds users, startups, and other basic entities
 */
async function seedBasicEntities() {
  console.log("Creating users with different roles...");
  
  // Create users with different roles
  const adminUser = await createUser(
    "Admin User",
    "admin@example.com",
    "password123",
    "ADMIN"
  );
  
  const entrepreneur1 = await createUser(
    "John Founder",
    "john@startup.com",
    "password123",
    "ENTREPRENEUR"
  );
  
  const entrepreneur2 = await createUser(
    "Lisa Creator",
    "lisa@techstudio.com",
    "password123",
    "ENTREPRENEUR"
  );
  
  const reviewer1 = await createUser(
    "Michael Evaluator",
    "michael@reviews.com",
    "password123",
    "REVIEWER"
  );
  
  const reviewer2 = await createUser(
    "Sarah Judge",
    "sarah@reviews.com",
    "password123",
    "REVIEWER"
  );
  
  const sponsor1 = await createUser(
    "David Investor",
    "david@investment.com",
    "password123",
    "SPONSOR"
  );
  
  const sponsor2 = await createUser(
    "Emma Capital",
    "emma@venturefund.com",
    "password123",
    "SPONSOR"
  );

  console.log("Creating startups...");

  // Draft startup
  const draftStartup = await createStartup(
    entrepreneur1.id,
    "EcoTech Solutions",
    "DRAFT",
    "We create eco-friendly tech products that reduce waste and energy consumption while offering cutting-edge functionality.",
    "Our product line includes solar-powered IoT devices, biodegradable electronics, and energy-efficient home automation systems.",
    ["Environment", "IoT", "Sustainability"],
    "SEED",
    "https://ecotech-solutions.example.com"
  );

  // Submitted startup
  const submittedStartup = await createStartup(
    entrepreneur1.id,
    "HealthAI",
    "SUBMITTED",
    "Using machine learning to detect health issues before they become serious problems.",
    "Our platform analyzes patterns in user health data to provide early warnings and preventative advice, reducing healthcare costs and improving outcomes.",
    ["Healthcare", "AI", "ML"],
    "EARLY",
    "https://healthai.example.com"
  );

  // Under review startup
  const underReviewStartup = await createStartup(
    entrepreneur2.id,
    "EduLearn Platform",
    "UNDER_REVIEW",
    "Transforming how students learn with personalized AI tutoring and interactive content.",
    "Our platform adapts to each student's learning style and pace, providing customized educational experiences that improve retention and engagement.",
    ["Education", "AI", "SaaS"],
    "SEED",
    "https://edulearn.example.com"
  );

  // Add reviews to under review startup
  await createReview(
    reviewer1.id,
    underReviewStartup.id,
    8.5,
    "Strong concept with excellent execution potential. The team has demonstrated a deep understanding of educational challenges and their AI approach is innovative.",
    "Recommend proceeding to the next stage after verifying technical implementation details.",
    "IN_PROGRESS"
  );

  // Accepted startup
  const acceptedStartup = await createStartup(
    entrepreneur2.id,
    "FinTech Pay",
    "ACCEPTED",
    "Making financial transactions accessible and affordable for all businesses.",
    "Our platform streamlines payment processing with lower fees, faster settlements, and better fraud protection than traditional payment processors.",
    ["FinTech", "Payments", "Small Business"],
    "GROWTH",
    "https://fintech-pay.example.com"
  );

  // Create startup call
  console.log("Creating startup call...");
  const startupCall = await createStartupCall(
    adminUser.id,
    "Tech Innovation Fund 2024",
    "Seeking innovative technology startups with potential to disrupt existing markets.",
    "PUBLISHED",
    new Date("2024-12-31"),
    new Date(),
    "Technology",
    "Global",
    "$100,000 - $500,000",
    ["Innovative solution", "Market potential", "Scalable business model"],
    ["Pre-seed to Series A", "Established team", "MVP or prototype"],
    ["Application review", "Interview", "Final selection"],
    "The Tech Innovation Fund is backed by industry leaders seeking to foster technological advancement across sectors.",
    "Submit your application through our platform. Selected startups will be invited for interviews."
  );

  console.log("Basic entities successfully seeded!");
  
  return { adminUser, startupCall };
}

/**
 * Seeds budget-related data
 */
async function seedBudgetData() {
  console.log("Seeding budget data...");

  try {
    // Find admin user
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      take: 1,
    });

    if (adminUsers.length === 0) {
      throw new Error("No admin user found. Basic entities should be seeded first.");
    }
    
    const adminUser = adminUsers[0];
    console.log(`Found admin user with ID: ${adminUser.id}`);

    // Find a published startup call
    const startupCalls = await prisma.startupCall.findMany({
      where: { status: "PUBLISHED" },
      take: 1,
    });

    if (startupCalls.length === 0) {
      throw new Error("No published startup call found. Basic entities should be seeded first.");
    }
    
    const startupCall = startupCalls[0];
    console.log(`Found startup call: ${startupCall.title} (ID: ${startupCall.id})`);

    // Create a main budget
    console.log("Creating main budget...");
    const mainBudget = await prisma.budget.create({
      data: {
        title: "Main Program Budget 2024",
        description: "Overall budget for the startup funding program",
        totalAmount: 500000,
        currency: "USD",
        fiscalYear: "2024",
        status: "active",
        startupCallId: startupCall.id,
        createdById: adminUser.id,
      },
    });
    
    console.log(`Created main budget with ID: ${mainBudget.id}`);

    // Create budget categories
    console.log("Creating budget categories...");
    
    const marketingCategory = await prisma.budgetCategory.create({
      data: {
        name: "Marketing",
        description: "Marketing and promotional expenses",
        allocatedAmount: 125000,
        budgetId: mainBudget.id,
      },
    });
    
    const operationsCategory = await prisma.budgetCategory.create({
      data: {
        name: "Operations",
        description: "Day-to-day operational expenses",
        allocatedAmount: 175000,
        budgetId: mainBudget.id,
      },
    });
    
    const technologyCategory = await prisma.budgetCategory.create({
      data: {
        name: "Technology",
        description: "Technology infrastructure and software",
        allocatedAmount: 200000,
        budgetId: mainBudget.id,
      },
    });
    
    console.log("Budget categories created successfully!");

    // Create expenses
    console.log("Creating sample expenses...");
    
    await prisma.expense.create({
      data: {
        title: "Social Media Campaign",
        description: "Q2 social media advertising campaign",
        amount: 45000,
        currency: "USD",
        date: new Date("2024-05-15"),
        status: "approved",
        budgetId: mainBudget.id,
        categoryId: marketingCategory.id,
        createdById: adminUser.id,
      },
    });
    
    await prisma.expense.create({
      data: {
        title: "Event Sponsorship",
        description: "Tech Startup Summit sponsorship",
        amount: 25000,
        currency: "USD",
        date: new Date("2024-06-20"),
        status: "pending",
        budgetId: mainBudget.id,
        categoryId: marketingCategory.id,
        createdById: adminUser.id,
      },
    });
    
    await prisma.expense.create({
      data: {
        title: "Office Supplies",
        description: "Monthly office supplies and equipment",
        amount: 3500,
        currency: "USD",
        date: new Date("2024-05-01"),
        status: "approved",
        budgetId: mainBudget.id,
        categoryId: operationsCategory.id,
        createdById: adminUser.id,
      },
    });
    
    await prisma.expense.create({
      data: {
        title: "Cloud Infrastructure",
        description: "Monthly AWS cloud services",
        amount: 12000,
        currency: "USD",
        date: new Date("2024-05-05"),
        status: "approved",
        budgetId: mainBudget.id,
        categoryId: technologyCategory.id,
        createdById: adminUser.id,
      },
    });
    
    console.log("Sample expenses created successfully!");
  } catch (error) {
    console.error("Error seeding budget data:", error);
    throw error;
  }
}

/**
 * Clears the database to avoid duplicate records
 */
async function clearDatabase() {
  console.log("Clearing database...");
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.expense.deleteMany({});
    await prisma.budgetCategory.deleteMany({});
    await prisma.budget.deleteMany({});
    
    await prisma.comment.deleteMany({});
    await prisma.financial.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.applicationReview.deleteMany({});
    await prisma.startupCallApplication.deleteMany({});
    await prisma.sponsorshipApplication.deleteMany({});
    await prisma.sponsorshipOpportunity.deleteMany({});
    await prisma.reviewCriteria.deleteMany({});
    await prisma.reviewAssignment.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.advertisement.deleteMany({});
    await prisma.sponsorship.deleteMany({});
    await prisma.startupCall.deleteMany({});
    await prisma.startup.deleteMany({});
    await prisma.notification.deleteMany({});
    
    // Delete user-related tables
    await prisma.account.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.verificationToken.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log("Database cleared successfully!");
  } catch (error) {
    console.error("Error clearing database:", error);
    throw error;
  }
}

/**
 * Creates a user with the specified attributes
 */
async function createUser(
  name: string,
  email: string,
  password: string,
  role: string
) {
  const hashedPassword = await hash(password, 10);
  
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role as Role,
    },
  });
}

/**
 * Creates a startup with the specified attributes
 */
async function createStartup(
  founderId: string,
  name: string,
  status: string,
  description: string,
  pitch: string,
  industry: string[],
  stage: string,
  website: string | null
) {
  return prisma.startup.create({
    data: {
      name,
      description,
      pitch,
      industry,
      stage,
      website,
      founderId,
      status: status as any,
    },
  });
}

/**
 * Creates a review for a startup
 */
async function createReview(
  reviewerId: string,
  startupId: string,
  score: number,
  feedback: string,
  recommendation: string,
  status: string = "COMPLETED"
) {
  return prisma.review.create({
    data: {
      reviewerId,
      startupId,
      score,
      feedback,
      recommendation,
      status,
    },
  });
}

/**
 * Creates a startup call
 */
async function createStartupCall(
  createdById: string,
  title: string,
  description: string,
  status: string,
  applicationDeadline: Date,
  publishedDate: Date | null,
  industry: string,
  location: string,
  fundingAmount: string | null,
  requirements: string[],
  eligibilityCriteria: string[],
  selectionProcess: string[],
  aboutSponsor: string | null,
  applicationProcess: string
) {
  return prisma.startupCall.create({
    data: {
      createdById,
      title,
      description,
      status: status as any,
      applicationDeadline,
      publishedDate,
      industry,
      location,
      fundingAmount,
      requirements,
      eligibilityCriteria,
      selectionProcess,
      aboutSponsor,
      applicationProcess,
    },
  });
}

// Run the main function
main()
  .then(() => console.log("Database seeding completed successfully!"))
  .catch((error) => {
    console.error("Fatal error during database seeding:", error);
    process.exit(1);
  }); 