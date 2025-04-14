// Import PrismaClient from the generated client
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

// Create a PrismaClient instance with debug logging
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// Create a hash function reference for cleaner code
const hash = bcryptjs.hash;

async function main() {
  console.log('Starting database seeding...');

  // Clear the database first to avoid duplicates
  await clearDatabase();
  
  // Create users with different roles
  console.log('Creating users...');
  const adminUser = await createUser('Admin User', 'admin@example.com', 'password123', 'ADMIN');
  const entrepreneur1 = await createUser('John Founder', 'john@startup.com', 'password123', 'ENTREPRENEUR');
  const entrepreneur2 = await createUser('Lisa Creator', 'lisa@techstudio.com', 'password123', 'ENTREPRENEUR');
  const reviewer1 = await createUser('Michael Evaluator', 'michael@reviews.com', 'password123', 'REVIEWER');
  const reviewer2 = await createUser('Sarah Judge', 'sarah@reviews.com', 'password123', 'REVIEWER');
  const sponsor1 = await createUser('David Investor', 'david@investment.com', 'password123', 'SPONSOR');
  const sponsor2 = await createUser('Emma Capital', 'emma@venturefund.com', 'password123', 'SPONSOR');
  
  // Create startups in different states
  console.log('Creating startups...');
  
  // Draft startup
  const draftStartup = await createStartup(
    entrepreneur1.id,
    'EcoTech Solutions',
    'DRAFT',
    'Sustainable technology solutions for everyday problems',
    'We create eco-friendly tech products that reduce waste and energy consumption while offering cutting-edge functionality.',
    'Our product line includes solar-powered IoT devices, biodegradable electronics, and energy-efficient home automation systems.',
    ['Environment', 'IoT', 'Sustainability'],
    'SEED',
    'https://ecotech-solutions.example.com'
  );
  
  // Submitted startup
  const submittedStartup = await createStartup(
    entrepreneur1.id,
    'HealthAI',
    'SUBMITTED',
    'AI-powered health diagnostics and prevention',
    'Using machine learning to detect health issues before they become serious problems.',
    'Our platform analyzes patterns in user health data to provide early warnings and preventative advice, reducing healthcare costs and improving outcomes.',
    ['Healthcare', 'AI', 'ML'],
    'EARLY',
    'https://healthai.example.com'
  );
  
  // Under review startup
  const underReviewStartup = await createStartup(
    entrepreneur2.id,
    'EduLearn Platform',
    'UNDER_REVIEW',
    'Next-generation educational platform',
    'Transforming how students learn with personalized AI tutoring and interactive content.',
    'Our platform adapts to each student\'s learning style and pace, providing customized educational experiences that improve retention and engagement.',
    ['Education', 'AI', 'SaaS'],
    'SEED',
    'https://edulearn.example.com'
  );
  
  // Add reviews to under review startup
  await createReview(
    reviewer1.id,
    underReviewStartup.id,
    8.5,
    9.0,
    8.0,
    8.5,
    8.5,
    'Strong concept with excellent execution potential. The team has demonstrated a deep understanding of educational challenges and their AI approach is innovative.'
  );
  
  // Accepted startup
  const acceptedStartup = await createStartup(
    entrepreneur2.id,
    'FinTech Pay',
    'ACCEPTED',
    'Simplified payment solutions for small businesses',
    'Making financial transactions accessible and affordable for all businesses.',
    'Our platform streamlines payment processing with lower fees, faster settlements, and better fraud protection than traditional payment processors.',
    ['FinTech', 'Payments', 'Small Business'],
    'GROWTH',
    'https://fintech-pay.example.com'
  );
  
  // Add reviews to accepted startup
  await createReview(
    reviewer1.id,
    acceptedStartup.id,
    9.0,
    8.5,
    9.5,
    9.0,
    9.0,
    'Excellent solution for an underserved market. Strong team with relevant experience and a clear path to revenue generation.'
  );
  
  await createReview(
    reviewer2.id,
    acceptedStartup.id,
    8.0,
    8.5,
    7.5,
    8.0,
    8.0,
    'Promising concept with good market fit. The team has demonstrated solid technical capabilities and understanding of the target market.'
  );
  
  // Add milestones to accepted startup
  await createMilestone(
    acceptedStartup.id,
    'MVP Launch',
    'Launch the minimum viable product to initial test users',
    new Date('2023-12-15'),
    'COMPLETED'
  );
  
  await createMilestone(
    acceptedStartup.id,
    'Secure First 100 Customers',
    'Onboard at least 100 paying customers to validate the business model',
    new Date('2024-03-01'),
    'COMPLETED'
  );
  
  await createMilestone(
    acceptedStartup.id,
    'Mobile App Release',
    'Launch companion mobile applications for iOS and Android',
    new Date('2024-06-15'),
    'IN_PROGRESS'
  );
  
  await createMilestone(
    acceptedStartup.id,
    'International Expansion',
    'Expand services to European markets',
    new Date('2024-12-01'),
    'PENDING'
  );
  
  // Add team members to accepted startup
  await createTeamMember(
    acceptedStartup.id,
    'Alex Chen',
    'alex@fintech-pay.example.com',
    'CTO',
    'Former senior engineer at PayPal with 10 years of experience in payment systems'
  );
  
  await createTeamMember(
    acceptedStartup.id,
    'Maria Rodriguez',
    'maria@fintech-pay.example.com',
    'CMO',
    'Marketing executive with background in financial services and B2B SaaS'
  );
  
  // Add tasks to accepted startup
  await createTask(
    acceptedStartup.id,
    'Implement Two-Factor Authentication',
    'Add 2FA support for enhanced security',
    new Date('2024-05-15'),
    'IN_PROGRESS',
    'HIGH',
    entrepreneur2.id
  );
  
  await createTask(
    acceptedStartup.id,
    'Develop API Documentation',
    'Create comprehensive documentation for integration partners',
    new Date('2024-05-30'),
    'TODO',
    'MEDIUM',
    null
  );
  
  await createTask(
    acceptedStartup.id,
    'User Interface Redesign',
    'Update the dashboard UI based on user feedback',
    new Date('2024-06-30'),
    'TODO',
    'MEDIUM',
    null
  );
  
  // Add sponsorships to accepted startup
  await createSponsorship(
    acceptedStartup.id,
    sponsor1.id,
    50000,
    'Initial seed investment',
    new Date('2023-11-15')
  );
  
  await createSponsorship(
    acceptedStartup.id,
    sponsor2.id,
    75000,
    'Series A participation',
    new Date('2024-02-10')
  );
  
  // Add expenses to accepted startup
  await createExpense(
    acceptedStartup.id,
    12000,
    'Development',
    'Cloud infrastructure and developer tools',
    new Date('2024-01-10')
  );
  
  await createExpense(
    acceptedStartup.id,
    8500,
    'Marketing',
    'Digital advertising campaign',
    new Date('2024-02-15')
  );
  
  await createExpense(
    acceptedStartup.id,
    4000,
    'Operations',
    'Office space and equipment',
    new Date('2024-03-01')
  );
  
  // Add comments/discussion to accepted startup
  const comment1 = await createComment(
    acceptedStartup.id,
    entrepreneur2.id,
    'We\'re excited to announce that we\'ve completed our first milestone ahead of schedule!'
  );
  
  await createComment(
    acceptedStartup.id,
    sponsor1.id,
    'Great news! Can you share more details about your customer acquisition strategy going forward?',
    comment1.id
  );
  
  await createComment(
    acceptedStartup.id,
    entrepreneur2.id,
    'We\'re focusing on partnerships with small business software providers and direct outreach through industry events. We\'ve already secured 3 partnership deals that should bring in about 50 new customers each month.',
    comment1.id
  );
  
  // Rejected startup
  const rejectedStartup = await createStartup(
    entrepreneur1.id,
    'VR Fitness',
    'REJECTED',
    'Virtual reality fitness training',
    'Making exercise fun and engaging through virtual reality experiences.',
    'Our VR fitness platform offers immersive workout environments and gamified exercise routines that make staying fit enjoyable and addictive.',
    ['VR/AR', 'Fitness', 'Gaming'],
    'IDEA',
    null
  );
  
  // Add reviews to rejected startup
  await createReview(
    reviewer2.id,
    rejectedStartup.id,
    5.0,
    6.5,
    4.0,
    4.5,
    5.0,
    'The concept is interesting but lacks differentiation from existing VR fitness applications. The team doesn\'t demonstrate sufficient technical expertise in VR development. Business model needs significant refinement.'
  );

  console.log('Database seeding completed successfully!');
}

// Helper functions

async function clearDatabase() {
  // Delete in order to respect foreign key constraints
  // Wrap each operation in try/catch to handle cases where tables don't exist
  try {
    if (prisma.comment) await prisma.comment.deleteMany({});
  } catch (e) {
    console.log('Error deleting comments:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.expense) await prisma.expense.deleteMany({});
  } catch (e) {
    console.log('Error deleting expenses:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.sponsorship) await prisma.sponsorship.deleteMany({});
  } catch (e) {
    console.log('Error deleting sponsorships:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.document) await prisma.document.deleteMany({});
  } catch (e) {
    console.log('Error deleting documents:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.task) await prisma.task.deleteMany({});
  } catch (e) {
    console.log('Error deleting tasks:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.teamMember) await prisma.teamMember.deleteMany({});
  } catch (e) {
    console.log('Error deleting team members:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.milestone) await prisma.milestone.deleteMany({});
  } catch (e) {
    console.log('Error deleting milestones:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.review) await prisma.review.deleteMany({});
  } catch (e) {
    console.log('Error deleting reviews:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.startup) await prisma.startup.deleteMany({});
  } catch (e) {
    console.log('Error deleting startups:', e instanceof Error ? e.message : String(e));
  }
  
  try {
    if (prisma.user) await prisma.user.deleteMany({});
  } catch (e) {
    console.log('Error deleting users:', e instanceof Error ? e.message : String(e));
  }
}

async function createUser(name: string, email: string, password: string, role: string) {
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
  tagline: string,
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
      tagline,
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
  innovationScore: number,
  marketScore: number,
  teamScore: number,
  executionScore: number,
  feedback: string
) {
  return prisma.review.create({
    data: {
      score,
      innovationScore,
      marketScore,
      teamScore,
      executionScore,
      feedback,
      reviewer: { connect: { id: reviewerId } },
      startup: { connect: { id: startupId } },
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

async function createTeamMember(
  startupId: string,
  name: string,
  email: string,
  role: string,
  bio: string | null
) {
  return prisma.teamMember.create({
    data: {
      name,
      email,
      role,
      bio,
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
  assignedToId: string | null
) {
  return prisma.task.create({
    data: {
      title,
      description,
      dueDate,
      status,
      priority,
      startup: { connect: { id: startupId } },
      ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
    },
  });
}

async function createSponsorship(
  startupId: string,
  sponsorId: string,
  amount: number,
  notes: string | null,
  date: Date
) {
  return prisma.sponsorship.create({
    data: {
      amount,
      notes,
      date,
      startup: { connect: { id: startupId } },
      sponsor: { connect: { id: sponsorId } },
    },
  });
}

async function createExpense(
  startupId: string,
  amount: number,
  category: string,
  description: string,
  date: Date
) {
  return prisma.expense.create({
    data: {
      amount,
      category,
      description,
      date,
      startup: { connect: { id: startupId } },
    },
  });
}

async function createComment(
  startupId: string,
  authorId: string,
  content: string,
  parentId: string | null = null
) {
  return prisma.comment.create({
    data: {
      content,
      parentId,
      startup: { connect: { id: startupId } },
      author: { connect: { id: authorId } },
    },
  });
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
    console.log('Database connection closed');
  });
