import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 * 
 * This solution addresses the critical "prepared statement does not exist" error
 * by completely disabling prepared statements and implementing proper connection management
 */

// For singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

// Create a client with all necessary fixes for the prepared statement issue
function createPrismaClient() {
  // First, enable direct SQL queries instead of prepared statements
  // This is set before client initialization to ensure it's applied
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = "true";
  
  // Create with basic logging options
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
    
    // Add the pgBouncer flag directly in the connection URL
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=1&pool_timeout=0`
      }
    }
  });
  
  // Access internal configs to enforce disabling prepared statements at all levels
  const prismaAny = client as any;
  if (prismaAny._engineConfig) {
    // Modify internal engine configuration to force disable prepared statements
    prismaAny._engineConfig.previewFeatures = [
      ...(prismaAny._engineConfig.previewFeatures || []),
      'nativeTypes'
    ];
    
    // Also override datasource URL to include pgBouncer flag
    prismaAny._engineConfig.datasourceOverrides = {
      db: {
        url: `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=1&pool_timeout=0`
      }
    };
    
    // Set transaction options to disable prepared statements
    prismaAny._engineConfig.transactionOptions = {
      isolationLevel: 'ReadCommitted',
      maxWait: 5000,
      timeout: 10000,
      usePreparedStatements: false
    };
    
    // For Prisma 4+, add this if available
    if (prismaAny._baseDmmf) {
      prismaAny._baseDmmf.featuresEnvVars = {
        ...prismaAny._baseDmmf.featuresEnvVars,
        nativeBindings: true
      };
    }
  }
  
  return client;
}

// Function to force-reconnect when issues are detected
async function resetConnection(client: PrismaClient) {
  try {
    // Forcibly disconnect
    await client.$disconnect();
    
    // For more aggressive reset (optional - uncomment if needed)
    // const prismaAny = client as any;
    // if (prismaAny._engine?.disconnect) {
    //   await prismaAny._engine.disconnect();
    // }
    
    console.log('Prisma connection reset successfully');
  } catch (e) {
    console.error('Error resetting Prisma connection:', e);
  }
}

// Use cached client or create new one
const prisma = global.prismaClient || createPrismaClient();

// Set up proper connection management
if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
  
  // Register connection management handlers
  if (typeof window === 'undefined') {
    if (!(global as any).__prismaListenerInitialized) {
      (global as any).__prismaListenerInitialized = true;
      
      // Clean up on process exit
      process.on('beforeExit', async () => {
        await prisma.$disconnect();
      });
      
      // Handle various process termination signals
      ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
        process.on(signal, async () => {
          console.log(`${signal} received, cleaning up Prisma connections`);
          await prisma.$disconnect();
          process.exit(0);
        });
      });
      
      // For Next.js Fast Refresh
      process.on('SIGHUP', async () => {
        console.log('SIGHUP received, reconnecting Prisma');
        await resetConnection(prisma);
      });
      
      // Additionally, handle uncaught errors that might be due to connection issues
      process.on('uncaughtException', async (err) => {
        if (err.message && err.message.includes('prepared statement')) {
          console.log('Uncaught Prisma prepared statement error, resetting connection');
          await resetConnection(prisma);
        }
      });
    }
  }
}

export default prisma;