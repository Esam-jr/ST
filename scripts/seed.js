// Simple seed script that can be run with Node.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMIN'
    }
  });
  
  console.log(`Created admin user: ${adminUser.name}`);
  
  // Create a sample startup
  const startup = await prisma.startup.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'EcoTech Solutions',
      description: 'Sustainable technology solutions for modern businesses',
      pitch: 'EcoTech Solutions is revolutionizing how businesses adopt sustainable practices through innovative technology.',
      sector: 'TECHNOLOGY',
      stage: 'SEED',
      status: 'UNDER_REVIEW',
      foundedDate: new Date('2024-01-15'),
      location: 'San Francisco, CA',
      website: 'https://ecotechsolutions.example.com',
      pitchDeck: 'https://example.com/pitch.pdf',
      founderUserId: adminUser.id
    }
  });
  
  console.log(`Created sample startup: ${startup.name}`);
  
  // Create a reviewer
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      name: 'Sample Reviewer',
      email: 'reviewer@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'REVIEWER'
    }
  });
  
  console.log(`Created reviewer: ${reviewer.name}`);
  
  // Create a review
  const review = await prisma.review.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      score: 8,
      feedback: 'This startup has strong potential with its innovative approach.',
      startupId: startup.id,
      reviewerId: reviewer.id
    }
  });
  
  console.log(`Created sample review by ${reviewer.name}`);
  
  // Create a milestone
  const milestone = await prisma.milestone.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'MVP Completion',
      description: 'Complete the minimum viable product',
      targetDate: new Date('2025-06-30'),
      status: 'IN_PROGRESS',
      startupId: startup.id
    }
  });
  
  console.log(`Created sample milestone: ${milestone.title}`);
  
  console.log('Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
