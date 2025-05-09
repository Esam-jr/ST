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

    // Check all enum types
    const enumTypesResult = await client.query(`
      SELECT n.nspname as schema, t.typname as name
      FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e'
      ORDER BY schema, name;
    `);
    
    console.log('Enum types in database:', JSON.stringify(enumTypesResult.rows, null, 2));

    // Check specific enum values if available
    if (enumTypesResult.rows.length > 0) {
      for (const enumType of enumTypesResult.rows) {
        const enumValuesResult = await client.query(`
          SELECT e.enumlabel as value
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = '${enumType.name}'
          ORDER BY e.enumsortorder;
        `);
        console.log(`Values for enum ${enumType.name}:`, JSON.stringify(enumValuesResult.rows, null, 2));
      }
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