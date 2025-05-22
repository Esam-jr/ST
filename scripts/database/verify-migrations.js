// Verify database migrations script
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();

async function verifyMigrations() {
  console.log('Verifying database migrations...');

  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if _prisma_migrations table exists
    const migrationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;

    if (!migrationTableExists[0].exists) {
      console.error('❌ _prisma_migrations table does not exist. Migrations may not have been applied.');
      process.exit(1);
    }

    console.log('✅ _prisma_migrations table exists');

    // Get applied migrations from database
    const appliedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE applied = 1
      ORDER BY finished_at;
    `;

    console.log(`✅ Found ${appliedMigrations.length} applied migrations in the database`);

    // Get migration files from migrations directory
    const migrationsDir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => dir !== 'migration_lock.toml')
      .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory());

    console.log(`✅ Found ${migrationDirs.length} migration directories in the filesystem`);

    // Check for migrations that are in files but not applied to DB
    const appliedMigrationNames = appliedMigrations.map(m => m.migration_name);
    const notAppliedMigrations = migrationDirs.filter(
      dirName => !appliedMigrationNames.includes(dirName)
    );

    if (notAppliedMigrations.length > 0) {
      console.warn('⚠️ The following migrations exist in the filesystem but are not applied to the database:');
      notAppliedMigrations.forEach(m => console.warn(`   - ${m}`));
      console.warn('Run `npx prisma migrate deploy` to apply these migrations');
    } else {
      console.log('✅ All migrations in the filesystem are applied to the database');
    }

    // Check migration files
    for (const migrationDir of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migrationDir);
      
      // Check for migration.sql
      const sqlFile = path.join(migrationPath, 'migration.sql');
      if (!fs.existsSync(sqlFile)) {
        console.error(`❌ Migration ${migrationDir} is missing migration.sql file`);
        continue;
      }
      
      // Check for meta data
      const metaFile = path.join(migrationPath, '.migration-meta');
      if (fs.existsSync(metaFile)) {
        console.log(`✅ Migration ${migrationDir} has metadata`);
      }
    }

    // Check schema consistency
    const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema.prisma file not found');
    } else {
      console.log('✅ schema.prisma file exists');
    }

    console.log('Migration verification complete');
    
  } catch (error) {
    console.error('Error verifying migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigrations()
  .then(() => {
    console.log('✅ All checks completed');
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 