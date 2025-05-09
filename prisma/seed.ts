// Import PrismaClient from the generated client
const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

// Create a PrismaClient instance with debug logging
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// Create a hash function reference for cleaner code
const hash = bcryptjs.hash;

async function main() {
  console.log("Starting database seeding...");

  // Clear the database first to avoid duplicates
  await clearDatabase();

  // Create users with different roles
  console.log("Creating users...");
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

  // Create startups in different states
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

  // Add reviews to accepted startup
  await createReview(
    reviewer1.id,
    acceptedStartup.id,
    9.0,
    "Excellent solution for an underserved market. Strong team with relevant experience and a clear path to revenue generation.",
    "Strongly recommend acceptance and funding allocation.",
    "COMPLETED"
  );

  await createReview(
    reviewer2.id,
    acceptedStartup.id,
    8.0,
    "Promising concept with good market fit. The team has demonstrated solid technical capabilities and understanding of the target market.",
    "Recommend acceptance with regular milestone reviews.",
    "COMPLETED"
  );

  // Add milestones to accepted startup
  await createMilestone(
    acceptedStartup.id,
    "MVP Launch",
    "Launch the minimum viable product to initial test users",
    new Date("2023-12-15"),
    "COMPLETED"
  );

  await createMilestone(
    acceptedStartup.id,
    "Secure First 100 Customers",
    "Onboard at least 100 paying customers to validate the business model",
    new Date("2024-03-01"),
    "COMPLETED"
  );

  await createMilestone(
    acceptedStartup.id,
    "Mobile App Release",
    "Launch companion mobile applications for iOS and Android",
    new Date("2024-06-15"),
    "IN_PROGRESS"
  );

  await createMilestone(
    acceptedStartup.id,
    "International Expansion",
    "Expand services to European markets",
    new Date("2024-12-01"),
    "PENDING"
  );

  // Add tasks to accepted startup
  await createTask(
    acceptedStartup.id,
    "Implement Two-Factor Authentication",
    "Add 2FA support for enhanced security",
    new Date("2024-05-15"),
    "IN_PROGRESS",
    "HIGH",
    entrepreneur2.id,
    entrepreneur2.id,
    new Date("2024-04-01")
  );

  await createTask(
    acceptedStartup.id,
    "Develop API Documentation",
    "Create comprehensive documentation for integration partners",
    new Date("2024-05-30"),
    "TODO",
    "MEDIUM",
    null,
    entrepreneur2.id,
    new Date("2024-04-15")
  );

  await createTask(
    acceptedStartup.id,
    "User Interface Redesign",
    "Update the dashboard UI based on user feedback",
    new Date("2024-06-30"),
    "TODO",
    "MEDIUM",
    null,
    entrepreneur2.id,
    new Date("2024-05-01")
  );

  // Add sponsorships to accepted startup
  await createSponsorship(
    acceptedStartup.id,
    sponsor1.id,
    50000,
    "Initial seed investment",
    new Date("2023-11-15"),
    "USD",
    "ACTIVE",
    new Date("2024-11-15")
  );

  await createSponsorship(
    acceptedStartup.id,
    sponsor2.id,
    75000,
    "Series A participation",
    new Date("2024-02-10"),
    "USD",
    "ACTIVE",
    new Date("2025-02-10")
  );

  // Add financials to accepted startup
  await createFinancial(
    acceptedStartup.id,
    12000,
    "Development",
    "Cloud infrastructure and developer tools",
    new Date("2024-01-10"),
    "EXPENSE",
    "USD"
  );

  await createFinancial(
    acceptedStartup.id,
    8500,
    "Marketing",
    "Digital advertising campaign",
    new Date("2024-02-15"),
    "EXPENSE",
    "USD"
  );

  await createFinancial(
    acceptedStartup.id,
    4000,
    "Operations",
    "Office space and equipment",
    new Date("2024-03-01"),
    "EXPENSE",
    "USD"
  );

  // Add comments/discussion to accepted startup
  const comment1 = await createComment(
    acceptedStartup.id,
    entrepreneur2.id,
    "We're excited to announce that we've completed our first milestone ahead of schedule!"
  );

  await createComment(
    acceptedStartup.id,
    sponsor1.id,
    "Great news! Can you share more details about your customer acquisition strategy going forward?",
    comment1.id
  );

  await createComment(
    acceptedStartup.id,
    entrepreneur2.id,
    "We're focusing on partnerships with small business software providers and direct outreach through industry events. We've already secured 3 partnership deals that should bring in about 50 new customers each month.",
    comment1.id
  );

  // Rejected startup
  const rejectedStartup = await createStartup(
    entrepreneur1.id,
    "VR Fitness",
    "REJECTED",
    "Making exercise fun and engaging through virtual reality experiences.",
    "Our VR fitness platform offers immersive workout environments and gamified exercise routines that make staying fit enjoyable and addictive.",
    ["VR/AR", "Fitness", "Gaming"],
    "IDEA",
    null
  );

  // Add reviews to rejected startup
  await createReview(
    reviewer2.id,
    rejectedStartup.id,
    5.0,
    "The concept is interesting but lacks differentiation from existing VR fitness applications. The team doesn't demonstrate sufficient technical expertise in VR development.",
    "Recommend rejection. Business model needs significant refinement and team should gain more domain expertise.",
    "COMPLETED"
  );

  // Create startup calls
  console.log("Creating startup calls...");

  // Draft startup call
  const draftCall = await createStartupCall(
    adminUser.id,
    "Tech Innovation Challenge",
    "A challenge for early-stage startups with innovative technology solutions in clean energy, healthcare, or education.",
    "DRAFT",
    new Date("2024-08-01"),
    null,
    "Technology",
    "Global",
    "$25,000 - $50,000",
    [
      "Less than 5 years in operation",
      "Working prototype or MVP required",
      "At least one full-time founder",
    ],
    [
      "Startups must be legally registered entities",
      "Applicants must have a viable business model",
      "Technology must be innovative and scalable",
      "Solution must address significant societal or market need",
    ],
    [
      "Initial application review",
      "Video pitch submission",
      "Technical assessment",
      "Final panel interview",
    ],
    "This call is sponsored by TechFund Ventures, a leading early-stage investor in technology startups with a portfolio of over 100 companies across 20 countries.",
    "Applicants must submit a detailed application form, pitch deck, and 3-minute video pitch. Shortlisted startups will be invited for technical assessment and final interviews."
  );

  // Published startup call
  const publishedCall = await createStartupCall(
    sponsor1.id,
    "Green Energy Solutions Fund",
    "Seeking innovative startups focused on renewable energy solutions and sustainable technologies that can help reduce carbon emissions.",
    "PUBLISHED",
    new Date("2024-07-15"),
    new Date("2024-04-15"),
    "CleanTech",
    "North America, Europe",
    "$100,000 - $250,000",
    [
      "Operational prototype or MVP",
      "Clear path to commercialization",
      "Demonstrated market need",
    ],
    [
      "Solution must directly impact carbon emission reduction",
      "Technology must be proprietary or have strong IP protection",
      "Team must have relevant technical expertise",
      "Startup must be less than 7 years old",
    ],
    [
      "Document screening",
      "First-round interview",
      "Technical due diligence",
      "Pitch to investment committee",
      "Final selection",
    ],
    "The Green Energy Solutions Fund is an initiative by David Investor and partners, focused on accelerating adoption of clean energy technologies worldwide.",
    "The application process includes a detailed submission form, financial projections, and pitch deck. Shortlisted candidates will proceed to interviews and technical assessment."
  );

  // Create an application for the published call
  await createStartupCallApplication(
    publishedCall.id,
    entrepreneur1.id,
    draftStartup.id,
    "EcoTech Solutions",
    "https://ecotech-solutions.example.com",
    new Date("2022-03-15"),
    "5-10",
    "CleanTech",
    "SEED",
    "We create eco-friendly tech products that reduce waste and energy consumption while offering cutting-edge functionality.",
    "Traditional electronics contribute significantly to e-waste and consume excessive energy, creating environmental challenges.",
    "Our technology uses biodegradable materials and ultra-efficient energy systems to create electronics with minimal environmental impact.",
    "500 units sold in beta testing, 30% month-over-month growth in the last quarter.",
    "Direct-to-consumer sales supplemented by B2B partnerships with eco-conscious corporations.",
    "$250,000 raised from angel investors",
    "Funding will be used for manufacturing scale-up, marketing expansion, and R&D for next-gen products.",
    "Proprietary biodegradable circuit technology with patent pending. Team with combined 25 years in sustainable materials science.",
    "Our founding team includes Dr. John Founder, a materials science PhD with 10+ years in sustainable electronics, and two former engineers from Tesla and Apple.",
    "SUBMITTED"
  );

  // Closed startup call
  await createStartupCall(
    sponsor2.id,
    "FinTech Innovation Program",
    "Looking for disruptive financial technology solutions that improve financial inclusion, lending, payments, or wealth management.",
    "CLOSED",
    new Date("2024-03-30"),
    new Date("2024-01-15"),
    "FinTech",
    "Global",
    "$50,000 - $150,000",
    [
      "Functional product with some traction",
      "Clear revenue model",
      "Regulatory compliance strategy",
    ],
    [
      "Solution must address significant financial pain point",
      "Technology must be scalable globally",
      "Team must have finance and technology expertise",
      "Startup must have existing users or customers",
    ],
    [
      "Application review",
      "Initial screening call",
      "Due diligence",
      "Demo day presentation",
      "Investment committee review",
    ],
    "The FinTech Innovation Program is sponsored by Emma Capital, a venture fund specializing in financial technology with a portfolio of over 30 FinTech companies worldwide.",
    "Applicants must complete the application form, provide detailed financial projections, and submit a 5-minute demo video. Selected startups may receive investment and join our accelerator program."
  );

  console.log("Database seeding completed successfully!");
}

// Helper functions

async function clearDatabase() {
  // Delete in order to respect foreign key constraints
  // Wrap each operation in try/catch to handle cases where tables don't exist
  try {
    if (prisma.startupCallApplication)
      await prisma.startupCallApplication.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting startup call applications:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.startupCall) await prisma.startupCall.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting startup calls:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.comment) await prisma.comment.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting comments:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.financial) await prisma.financial.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting financials:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.sponsorship) await prisma.sponsorship.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting sponsorships:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.document) await prisma.document.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting documents:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.task) await prisma.task.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting tasks:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.milestone) await prisma.milestone.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting milestones:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.review) await prisma.review.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting reviews:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.startup) await prisma.startup.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting startups:",
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    if (prisma.user) await prisma.user.deleteMany({});
  } catch (e) {
    console.log(
      "Error deleting users:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

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
      role,
    },
  });
}

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
      status,
      description,
      pitch,
      industry,
      stage,
      website,
      founder: { connect: { id: founderId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

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
      score,
      feedback,
      recommendation,
      status,
      reviewer: { connect: { id: reviewerId } },
      startup: { connect: { id: startupId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function createMilestone(
  startupId: string,
  title: string,
  description: string,
  dueDate: Date,
  status: string
) {
  return prisma.milestone.create({
    data: {
      title,
      description,
      dueDate,
      status,
      startup: { connect: { id: startupId } },
    },
  });
}

async function createTask(
  startupId: string,
  title: string,
  description: string,
  dueDate: Date,
  status: string,
  priority: string,
  assignedToId: string | null,
  creatorId: string = "1", // Default to admin user if not specified
  startDate: Date = new Date(), // Default to current date if not specified
  milestoneId: string | null = null
) {
  return prisma.task.create({
    data: {
      title,
      description,
      dueDate,
      status,
      priority,
      startDate,
      startup: { connect: { id: startupId } },
      ...(assignedToId ? { assignee: { connect: { id: assignedToId } } } : {}),
      ...(milestoneId ? { milestone: { connect: { id: milestoneId } } } : {}),
      creator: { connect: { id: creatorId } },
    },
  });
}

async function createSponsorship(
  startupId: string,
  sponsorId: string,
  amount: number,
  description: string | null,
  startDate: Date,
  currency: string = "USD",
  status: string = "ACTIVE",
  endDate: Date | null = null
) {
  return prisma.sponsorship.create({
    data: {
      amount,
      currency,
      description,
      status,
      startDate,
      endDate,
      startup: { connect: { id: startupId } },
      sponsor: { connect: { id: sponsorId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function createFinancial(
  startupId: string,
  amount: number,
  category: string,
  description: string | null,
  date: Date,
  type: string = "EXPENSE",
  currency: string = "USD"
) {
  return prisma.financial.create({
    data: {
      amount,
      category,
      description,
      date,
      type,
      currency,
      startup: { connect: { id: startupId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function createComment(
  startupId: string,
  userId: string,
  content: string,
  parentId: string | null = null
) {
  return prisma.comment.create({
    data: {
      content,
      startup: { connect: { id: startupId } },
      user: { connect: { id: userId } },
      ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

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
      title,
      description,
      status,
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
      createdBy: { connect: { id: createdById } },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function createStartupCallApplication(
  callId: string,
  userId: string,
  startupId: string | null,
  startupName: string,
  website: string | null,
  foundingDate: Date,
  teamSize: string,
  industry: string,
  stage: string,
  description: string,
  problem: string,
  solution: string,
  traction: string | null,
  businessModel: string,
  funding: string | null,
  useOfFunds: string,
  competitiveAdvantage: string,
  founderBio: string,
  status: string = "SUBMITTED"
) {
  return prisma.startupCallApplication.create({
    data: {
      call: { connect: { id: callId } },
      user: { connect: { id: userId } },
      ...(startupId ? { startup: { connect: { id: startupId } } } : {}),
      startupName,
      website,
      foundingDate,
      teamSize,
      industry,
      stage,
      description,
      problem,
      solution,
      traction,
      businessModel,
      funding,
      useOfFunds,
      competitiveAdvantage,
      founderBio,
      status,
      reviewsCompleted: 0,
      reviewsTotal: 3,
      submittedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting from database...");
    await prisma.$disconnect();
    console.log("Database connection closed");
  });
