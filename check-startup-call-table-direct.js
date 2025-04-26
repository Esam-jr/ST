const { Client } = require('pg');
require('dotenv').config();

async function main() {
  // Create a new client
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully');

    // Check if StartupCall table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'StartupCall'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log('StartupCall table exists:', tableExists);

    if (tableExists) {
      // Count records in the StartupCall table
      const countResult = await client.query('SELECT COUNT(*) FROM "StartupCall"');
      console.log(`StartupCall table contains ${countResult.rows[0].count} records`);
      
      // Check table columns
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'StartupCall'
      `);
      console.log('Table columns:', JSON.stringify(columnsResult.rows, null, 2));
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

main(); 