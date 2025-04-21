import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js
 * 
 * This module creates a singleton instance of PrismaClient that works reliably:
 * 1. Prevents multiple instances during development hot reloads
 * 2. Configures the client to work with Supabase's PgBouncer
 * 3. Properly handles connection cleanup on process exit
 * 4. Configures the client based on the environment
 */

// Define globals for PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

// Configuration for PrismaClient to work with connection poolers like PgBouncer
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    // Log queries only in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    
    // Critical configuration for Supabase
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Access internal client to configure it to work with PgBouncer
  // This is necessary to avoid "prepared statement already exists" errors
  // TypeScript doesn't know about these internal properties, so we need to use any
  const prismaAny = client as any;
  
  // Disable prepared statements to prevent errors with PgBouncer
  if (prismaAny._engineConfig) {
    prismaAny._engineConfig.previewFeatures = [
      ...(prismaAny._engineConfig.previewFeatures || []),
      'nativeTypes'
    ];
    
    // Set internal transaction options - critical for fixing the error
    prismaAny._engineConfig.transactionOptions = {
      usePreparedStatements: false
    };
  }
  
  return client;
};

// Use globalThis to create a singleton that survives Next.js hot reloads
// In production, this creates a new instance once for the entire application
// In development, this maintains a single instance across hot reloads
const prisma = globalThis._prisma ?? prismaClientSingleton();

// Handle connection management - important for development hot reloading
if (process.env.NODE_ENV !== 'production') {
  // In development, store the instance on the global object
  globalThis._prisma = prisma;
  
  // Add clean disconnection handler only once
  if (typeof window === 'undefined') { // Only in Node.js environment, not in browser
    // Track if we've already added a listener to avoid memory leaks
    if (!(globalThis as any).__prismaListenerAdded) {
      (globalThis as any).__prismaListenerAdded = true;
      
      // Clean up connections before Node.js process exits
      // The beforeExit event is emitted when Node.js empties its event loop
      process.on('beforeExit', async () => {
        await prisma.$disconnect();
      });
      
      // Also handle force termination scenarios
      process.on('SIGTERM', async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
      
      // Also listen for manual interruption
      process.on('SIGINT', async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    }
  }
}

export default prisma;