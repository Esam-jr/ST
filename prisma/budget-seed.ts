import { PrismaClient, StartupCallStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding budget data...");

  // Find the first admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("No admin user found. Please ensure an admin user exists.");
    return;
  }

  // Find an existing startup call or create a new one
  console.log("Finding or creating sample startup call...");
  let startupCall = await prisma.startupCall.findFirst({
    where: {
      OR: [
        { title: { contains: "Innovation" } },
        { title: { contains: "Challenge" } },
      ],
    },
  });

  if (!startupCall) {
    // Create a sample startup call
    startupCall = await prisma.startupCall.create({
      data: {
        title: "Tech Innovation Challenge 2024",
        description:
          "A startup call for innovative technology solutions in healthcare and education.",
        status: StartupCallStatus.PUBLISHED,
        applicationDeadline: new Date("2024-12-31"),
        publishedDate: new Date("2024-05-01"),
        industry: "Technology",
        location: "Global",
        fundingAmount: "$100,000",
        requirements: [
          "Prototype ready",
          "Team of at least 2",
          "Scalable solution",
        ],
        eligibilityCriteria: [
          "Early-stage startup",
          "Less than 3 years old",
          "Innovative tech solution",
        ],
        selectionProcess: ["Application review", "Interview", "Final pitch"],
        aboutSponsor:
          "Our organization supports innovative startups that are making a difference.",
        applicationProcess:
          "Submit your application through our online portal.",
        createdById: adminUser.id,
      },
    });
  }

  console.log(`Using startup call: ${startupCall.title} (${startupCall.id})`);

  // Clear existing budget data for this startup call
  console.log("Clearing existing budget data...");
  try {
    // First delete all expenses related to this startup call's budgets
    const budgetIds = await prisma.budget.findMany({
      where: { startupCallId: startupCall.id },
      select: { id: true },
    });

    if (budgetIds.length > 0) {
      await prisma.expense.deleteMany({
        where: { budgetId: { in: budgetIds.map((b) => b.id) } },
      });

      // Then delete all budget categories
      await prisma.budgetCategory.deleteMany({
        where: { budgetId: { in: budgetIds.map((b) => b.id) } },
      });

      // Finally delete the budgets
      await prisma.budget.deleteMany({
        where: { startupCallId: startupCall.id },
      });
    }
  } catch (error) {
    console.error("Error clearing existing budget data:", error);
    // Continue with seeding anyway
  }

  // Create sample budgets for the startup call
  console.log("Creating sample budgets...");
  const budget1 = await prisma.budget.create({
    data: {
      title: "Program Operations Budget",
      description:
        "Budget for the operation and management of the startup program",
      totalAmount: 75000,
      currency: "USD",
      fiscalYear: "2024",
      status: "active",
      startupCallId: startupCall.id,
    },
  });

  const budget2 = await prisma.budget.create({
    data: {
      title: "Marketing & Events Budget",
      description: "Budget allocated for marketing initiatives and events",
      totalAmount: 25000,
      currency: "USD",
      fiscalYear: "2024",
      status: "active",
      startupCallId: startupCall.id,
    },
  });

  // Create sample budget categories for the first budget
  console.log("Creating sample budget categories...");
  const categories1 = [
    {
      name: "Staff & Personnel",
      description: "Salaries and compensation for program staff",
      allocatedAmount: 40000,
      budgetId: budget1.id,
    },
    {
      name: "Technology & Equipment",
      description: "Technology infrastructure and equipment costs",
      allocatedAmount: 15000,
      budgetId: budget1.id,
    },
    {
      name: "Administrative Expenses",
      description: "Office supplies, utilities, and admin costs",
      allocatedAmount: 10000,
      budgetId: budget1.id,
    },
    {
      name: "Miscellaneous",
      description: "Unforeseen expenses and contingency funds",
      allocatedAmount: 10000,
      budgetId: budget1.id,
    },
  ];

  // Create sample budget categories for the second budget
  const categories2 = [
    {
      name: "Digital Marketing",
      description: "Online advertising and social media campaigns",
      allocatedAmount: 8000,
      budgetId: budget2.id,
    },
    {
      name: "Events & Workshops",
      description: "Hosting events, workshops, and demo days",
      allocatedAmount: 12000,
      budgetId: budget2.id,
    },
    {
      name: "Content Creation",
      description: "Creating promotional materials and content",
      allocatedAmount: 5000,
      budgetId: budget2.id,
    },
  ];

  // Insert all categories
  const cat1 = await prisma.budgetCategory.create({ data: categories1[0] });
  const cat2 = await prisma.budgetCategory.create({ data: categories1[1] });
  const cat3 = await prisma.budgetCategory.create({ data: categories1[2] });
  const cat4 = await prisma.budgetCategory.create({ data: categories1[3] });
  const cat5 = await prisma.budgetCategory.create({ data: categories2[0] });
  const cat6 = await prisma.budgetCategory.create({ data: categories2[1] });
  const cat7 = await prisma.budgetCategory.create({ data: categories2[2] });

  // Create sample expenses
  console.log("Creating sample expenses...");
  const expenses = [
    {
      title: "Program Manager Salary",
      description: "Monthly salary for the program manager",
      amount: 5000,
      currency: "USD",
      date: new Date("2024-05-15"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat1.id,
    },
    {
      title: "Mentor Compensation",
      description: "Compensation for program mentors",
      amount: 2500,
      currency: "USD",
      date: new Date("2024-05-20"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat1.id,
    },
    {
      title: "Laptops for Staff",
      description: "Purchase of laptops for program staff",
      amount: 3600,
      currency: "USD",
      date: new Date("2024-05-10"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat2.id,
    },
    {
      title: "Office Supplies",
      description: "Monthly office supplies",
      amount: 450,
      currency: "USD",
      date: new Date("2024-05-05"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat3.id,
    },
    {
      title: "Facebook Ads Campaign",
      description: "Social media advertising for program promotion",
      amount: 1200,
      currency: "USD",
      date: new Date("2024-05-08"),
      status: "approved",
      budgetId: budget2.id,
      categoryId: cat5.id,
    },
    {
      title: "Startup Showcase Event",
      description: "Venue rental and catering for startup showcase",
      amount: 3500,
      currency: "USD",
      date: new Date("2024-06-15"),
      status: "pending",
      budgetId: budget2.id,
      categoryId: cat6.id,
    },
    {
      title: "Promotional Video",
      description: "Creation of program promotional video",
      amount: 1800,
      currency: "USD",
      date: new Date("2024-05-25"),
      status: "pending",
      budgetId: budget2.id,
      categoryId: cat7.id,
    },
    {
      title: "Software Subscriptions",
      description: "Monthly subscriptions for program management tools",
      amount: 350,
      currency: "USD",
      date: new Date("2024-05-01"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat2.id,
    },
    {
      title: "Workshop Materials",
      description: "Materials for entrepreneurship workshop",
      amount: 750,
      currency: "USD",
      date: new Date("2024-05-22"),
      status: "in_review",
      budgetId: budget2.id,
      categoryId: cat6.id,
    },
    {
      title: "Unexpected Facility Repair",
      description: "Emergency repair of office facilities",
      amount: 1200,
      currency: "USD",
      date: new Date("2024-05-18"),
      status: "approved",
      budgetId: budget1.id,
      categoryId: cat4.id,
    },
  ];

  // Insert all expenses
  for (const expense of expenses) {
    await prisma.expense.create({ data: expense });
  }

  console.log("Budget data seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding budget data:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting from database...");
    await prisma.$disconnect();
    console.log("Database connection closed");
  });
