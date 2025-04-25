const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  console.log('Starting migration fix for Sponsorship status column...');
  
  // Create a direct pg client to execute raw SQL
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully');

    // Start a transaction
    await client.query('BEGIN');

    console.log('1. Adding new temporary status column as TEXT type...');
    await client.query('ALTER TABLE "Sponsorship" ADD COLUMN "status_new" TEXT');

    console.log('2. Copying data from status to status_new...');
    await client.query('UPDATE "Sponsorship" SET "status_new" = "status"::TEXT');

    console.log('3. Setting NOT NULL constraint on status_new...');
    await client.query('ALTER TABLE "Sponsorship" ALTER COLUMN "status_new" SET NOT NULL');

    console.log('4. Dropping the old status column...');
    await client.query('ALTER TABLE "Sponsorship" DROP COLUMN "status"');

    console.log('5. Renaming status_new to status...');
    await client.query('ALTER TABLE "Sponsorship" RENAME COLUMN "status_new" TO "status"');

    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration fix completed successfully!');
    
    // Verify the changes
    console.log('Verifying changes...');
    const result = await client.query('SELECT id, status FROM "Sponsorship"');
    console.log(`Found ${result.rows.length} sponsorships with the new status column:`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Status: ${row.status}`);
    });

  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error('Error during migration fix:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

main()
  .catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
  }); 