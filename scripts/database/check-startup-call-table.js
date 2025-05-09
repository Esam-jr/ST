const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking StartupCall table...');
    
    // Try to count StartupCall records
    const count = await prisma.startupCall.count();
    console.log(`StartupCall table exists and contains ${count} records.`);
    
    // Check table definition
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'StartupCall'
    `;
    console.log('Table columns:', tableInfo);
    
  } catch (error) {
    console.error('Error checking StartupCall table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 