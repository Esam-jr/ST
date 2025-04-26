const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Advertisement table...');
    
    // Try to count Advertisement records
    const count = await prisma.advertisement.count();
    console.log(`Advertisement table exists and contains ${count} records.`);
    
    // Check table definition
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Advertisement'
    `;
    console.log('Table columns:', tableInfo);
    
  } catch (error) {
    console.error('Error checking Advertisement table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 