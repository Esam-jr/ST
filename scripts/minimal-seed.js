// A minimal seed script designed to work with Supabase
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Create the client with isolated transactions to avoid prepared statement conflicts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Starting minimal database seeding...');
  
  try {
    // Create admin user with createMany to avoid prepared statement issues
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('Creating users...');
    await prisma.$executeRaw`INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Admin User', 'admin@example.com', ${hashedPassword}, 'ADMIN', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING`;
      
    console.log('Creating startup...');
    // Get the admin user ID
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });
    
    if (adminUser) {
      await prisma.$executeRaw`INSERT INTO "Startup" (
        id, name, description, pitch, sector, stage, status, "foundedDate", location, website, "pitchDeck", 
        "founderUserId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'EcoTech Solutions', 'Sustainable technology solutions', 
        'Revolutionary green tech for businesses', 'TECHNOLOGY', 'SEED', 'UNDER_REVIEW',
        '2024-01-15', 'San Francisco, CA', 'https://example.com', 'https://example.com/pitch.pdf',
        ${adminUser.id}, NOW(), NOW()
      ) ON CONFLICT DO NOTHING`;
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

main()
  .then(async () => {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
