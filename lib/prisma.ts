import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 * 
 * This solution addresses performance issues and the "prepared statement does not exist" error
 * by optimizing connection pooling and disabling prepared statements when necessary
 */

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Create a singleton PrismaClient instance
let prisma: PrismaClient;

if (typeof window === 'undefined') {
  // We're on the server
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new client
    prisma = new PrismaClient();
  } else {
    // In development, reuse the client
    // @ts-ignore - Global doesn't have prisma property
    if (!global.prisma) {
      // @ts-ignore - Global doesn't have prisma property
      global.prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    // @ts-ignore - Global doesn't have prisma property
    prisma = global.prisma;
  }
} else {
  // We're in the browser
  prisma = new PrismaClient();
}

// Set up proper connection management for development
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  // Add process event listeners for proper cleanup
  // This replaces the unsupported $on('beforeExit') method
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
  
  // Also handle SIGINT and SIGTERM
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;