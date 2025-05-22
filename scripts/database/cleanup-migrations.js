// Migration cleanup script
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanupMigrations() {
  console.log('Starting migration cleanup...');

  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create migrations archive directory if it doesn't exist
    const archiveDir = path.join(__dirname, '..', '..', 'prisma', 'migrations-archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
      console.log(`✅ Created migrations archive directory: ${archiveDir}`);
    }

    // Get migration files from migrations directory
    const migrationsDir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => dir !== 'migration_lock.toml')
      .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory());

    console.log(`Found ${migrationDirs.length} migration directories in the filesystem`);

    // Check for test migrations (these often have "test" in their name)
    const testMigrations = migrationDirs.filter(
      dirName => dirName.toLowerCase().includes('test')
    );

    if (testMigrations.length > 0) {
      console.log(`Found ${testMigrations.length} test migrations to archive:`);
      testMigrations.forEach(m => console.log(`   - ${m}`));
      
      // Ask for confirmation (if this were interactive)
      console.log('Would archive these migrations (set DRY_RUN=false to actually perform this operation)');
      
      // If not a dry run, move these files
      const isDryRun = process.env.DRY_RUN !== 'false';
      
      if (!isDryRun) {
        for (const migrationDir of testMigrations) {
          const sourcePath = path.join(migrationsDir, migrationDir);
          const destPath = path.join(archiveDir, migrationDir);
          
          // Move the directory
          fs.renameSync(sourcePath, destPath);
          console.log(`✅ Moved ${migrationDir} to archive`);
        }
      }
    } else {
      console.log('✅ No test migrations found');
    }

    // Look for duplicate migrations (migrations that try to do the same thing)
    // This is a simple heuristic - migrations with similar names created close together in time
    const migrationPrefixes = new Map();
    const potentialDuplicates = [];
    
    for (const migrationDir of migrationDirs) {
      // Get the descriptive part of the migration name (after the timestamp)
      const parts = migrationDir.split('_');
      if (parts.length > 1) {
        // Join all parts except the first (timestamp)
        const descriptiveName = parts.slice(1).join('_');
        
        if (migrationPrefixes.has(descriptiveName)) {
          // This might be a duplicate
          potentialDuplicates.push({
            original: migrationPrefixes.get(descriptiveName),
            duplicate: migrationDir
          });
        } else {
          migrationPrefixes.set(descriptiveName, migrationDir);
        }
      }
    }
    
    if (potentialDuplicates.length > 0) {
      console.log(`Found ${potentialDuplicates.length} potential duplicate migrations:`);
      potentialDuplicates.forEach(pair => {
        console.log(`   - ${pair.original} and ${pair.duplicate} might be duplicates`);
      });
      console.log('Please review these manually before archiving.');
    } else {
      console.log('✅ No potential duplicate migrations found');
    }

    console.log('Migration cleanup complete');
    
  } catch (error) {
    console.error('Error during migration cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMigrations()
  .then(() => {
    console.log('✅ All cleanup tasks completed');
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 