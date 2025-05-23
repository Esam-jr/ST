import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data in the correct order
  await prisma.sponsorshipApplication.deleteMany();
  await prisma.sponsorshipOpportunity.deleteMany();
  await prisma.startupCall.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create sponsor user
  const sponsorPassword = await hash('sponsor123', 12);
  await prisma.user.create({
    data: {
      name: 'Sponsor User',
      email: 'sponsor@example.com',
      password: sponsorPassword,
      role: 'SPONSOR',
    },
  });

  // Create reviewer user
  const reviewerPassword = await hash('reviewer123', 12);
  await prisma.user.create({
    data: {
      name: 'Reviewer User',
      email: 'reviewer@example.com',
      password: reviewerPassword,
      role: 'REVIEWER',
    },
  });

  // Create entrepreneur user
  const entrepreneurPassword = await hash('entrepreneur123', 12);
  await prisma.user.create({
    data: {
      name: 'Entrepreneur User',
      email: 'entrepreneur@example.com',
      password: entrepreneurPassword,
      role: 'ENTREPRENEUR',
    },
  });

  console.log('Successfully seeded database');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });