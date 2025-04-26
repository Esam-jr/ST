import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 * 
 * This solution addresses performance issues and the "prepared statement does not exist" error
 * by optimizing connection pooling and disabling prepared statements when necessary
 */

// For singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

// Create a client with optimized connection settings
function createPrismaClient() {
  // Enable direct SQL queries instead of prepared statements to prevent errors
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = "true";
  
  // Create with optimized logging options
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
    
    // Optimize connection URL with better connection pooling settings
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=5&pool_timeout=10`
      }
    }
  });
  
  // Access internal configs to optimize performance
  const prismaAny = client as any;
  if (prismaAny._engineConfig) {
    // Keep necessary preview features
    prismaAny._engineConfig.previewFeatures = [
      ...(prismaAny._engineConfig.previewFeatures || []),
      'nativeTypes'
    ];
    
    // Optimize datasource settings
    prismaAny._engineConfig.datasourceOverrides = {
      db: {
        url: `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=5&pool_timeout=10`
      }
    };
    
    // Optimize transaction options for better performance
    prismaAny._engineConfig.transactionOptions = {
      isolationLevel: 'ReadCommitted',
      maxWait: 2000,     // Reduced from 5000
      timeout: 5000,     // Reduced from 10000
      usePreparedStatements: false
    };
    
    // For Prisma 4+, optimize native bindings
    if (prismaAny._baseDmmf) {
      prismaAny._baseDmmf.featuresEnvVars = {
        ...prismaAny._baseDmmf.featuresEnvVars,
        nativeBindings: true
      };
    }
  }
  
  return client;
}

// Optimized function to reset connection when issues are detected
async function resetConnection(client: PrismaClient) {
  try {
    // Forcibly disconnect
    await client.$disconnect();
    console.log('Prisma connection reset successfully');
  } catch (e) {
    console.error('Error resetting Prisma connection:', e);
  }
}

// Use cached client or create new one with optimized settings
const prisma = global.prismaClient || createPrismaClient();

// Set up proper connection management for development
if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
  
  // Register optimized connection management handlers
  if (typeof window === 'undefined') {
    if (!(global as any).__prismaListenerInitialized) {
      (global as any).__prismaListenerInitialized = true;
      
      // Clean up on process exit
      process.on('beforeExit', async () => {
        await prisma.$disconnect();
      });
      
      // Handle termination signals efficiently
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
      
      // Handle connection errors
      process.on('uncaughtException', async (err) => {
        if (err.message && (
          err.message.includes('prepared statement') ||
          err.message.includes('connection') ||
          err.message.includes('timeout')
        )) {
          console.log('Uncaught Prisma error, resetting connection:', err.message);
          await resetConnection(prisma);
        }
      });
    }
  }
}

export default prisma;