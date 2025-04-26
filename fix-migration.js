// This script updates all null status values in the Sponsorship table
// to a default value, allowing the migration to proceed

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database fix...');
  
  try {
    // Find all sponsorships with null status
    const sponsorshipsWithNullStatus = await prisma.sponsorship.findMany({
      where: {
        status: null
      },
      select: { id: true }
    });
    
    console.log(`Found ${sponsorshipsWithNullStatus.length} sponsorships with null status`);
    
    if (sponsorshipsWithNullStatus.length > 0) {
      // Get all IDs to update
      const idsToUpdate = sponsorshipsWithNullStatus.map(s => s.id);
      
      // Update all sponsorships with null status to have a default status
      const updateResult = await prisma.sponsorship.updateMany({
        where: {
          id: { in: idsToUpdate }
        },
        data: {
          status: 'ACTIVE'
        }
      });
      
      console.log(`Updated ${updateResult.count} sponsorships with default status 'ACTIVE'`);
    } else {
      console.log('No sponsorships with null status found.');
    }
    
    console.log('Database fix complete. You can now run the migration.');
  } catch (error) {
    console.error('Error during database fix:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 