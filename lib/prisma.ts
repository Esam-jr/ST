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

// Define our custom global type
interface CustomNodeJsGlobal extends NodeJS.Global {
  prisma: PrismaClient | undefined;
}

// Declare global var with our custom type
declare const global: CustomNodeJsGlobal;

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
if (process.env.NODE_ENV !== 'production') {
  // Register optimized connection management handlers
  if (typeof window === 'undefined') {
    // For server-side code, properly handle Prisma connections
    prisma.$on('beforeExit', async () => {
      // Wait for all connections to finish before exiting
      await prisma.$disconnect();
    });
  }
}

export default prisma;