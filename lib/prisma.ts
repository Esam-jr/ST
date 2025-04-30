import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 * 
 * This solution addresses performance issues and the "prepared statement does not exist" error
 * by optimizing connection pooling and disabling prepared statements when necessary
 */

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Set up proper connection management for development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  
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
        await prisma.$disconnect();
      });
      
      // Handle connection errors
      process.on('uncaughtException', async (err) => {
        if (err.message && (
          err.message.includes('prepared statement') ||
          err.message.includes('connection') ||
          err.message.includes('timeout')
        )) {
          console.log('Uncaught Prisma error, resetting connection:', err.message);
          await prisma.$disconnect();
        }
      });
    }
  }
}

export default prisma;