const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Hash password for all users
    const password = await bcrypt.hash('password123', 10);

    // Create users
    console.log('Creating users...');
    const users = await prisma.user.createMany({
      data: [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: password,
          role: 'ADMIN'
        },
        {
          name: 'Entrepreneur User',
          email: 'entrepreneur@example.com',
          password: password,
          role: 'USER'
        },
        {
          name: 'Reviewer User',
          email: 'reviewer@example.com',
          password: password,
          role: 'REVIEWER'
        }
      ],
      skipDuplicates: true
    });
    console.log('Created users:', users.count);

    // Get the entrepreneur user for startup creation
    const entrepreneur = await prisma.user.findUnique({
      where: { email: 'entrepreneur@example.com' }
    });

    // Create startup
    console.log('Creating startup...');
    const startup = await prisma.startup.create({
      data: {
        name: 'EcoTech Solutions',
        description: 'Sustainable technology solutions for modern businesses',
        pitch: 'EcoTech Solutions is revolutionizing how businesses adopt sustainable practices through innovative technology.',
        industry: ['TECHNOLOGY', 'SUSTAINABILITY'],
        stage: 'SEED',
        website: 'https://ecotechsolutions.example.com',
        status: 'UNDER_REVIEW',
        founderId: entrepreneur.id
      }
    });
    console.log('Created startup:', startup.name);

    // Create milestones
    console.log('Creating milestones...');
    const milestones = await prisma.milestone.createMany({
      data: [
        {
          title: 'MVP Development',
          description: 'Complete the minimum viable product development',
          dueDate: new Date('2024-06-30'),
          status: 'IN_PROGRESS',
          startupId: startup.id
        },
        {
          title: 'Market Research',
          description: 'Complete comprehensive market research and competitor analysis',
          dueDate: new Date('2024-04-30'),
          status: 'PENDING',
          startupId: startup.id
        },
        {
          title: 'Initial Funding',
          description: 'Secure seed funding of $500,000',
          dueDate: new Date('2024-08-30'),
          status: 'PENDING',
          startupId: startup.id
        }
      ]
    });
    console.log('Created milestones:', milestones.count);

    // Get reviewer for review creation
    const reviewer = await prisma.user.findUnique({
      where: { email: 'reviewer@example.com' }
    });

    // Create review
    console.log('Creating review...');
    const review = await prisma.review.create({
      data: {
        startupId: startup.id,
        reviewerId: reviewer.id,
        score: 8.5,
        feedback: 'Strong potential in the sustainability market with innovative approach.',
        recommendation: 'Proceed with incubation program',
        status: 'COMPLETED'
      }
    });
    console.log('Created review for startup');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
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