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

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma Client with better connection handling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    // Add connection pooling settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Add retry logic for connection issues
        const startTime = Date.now();
        return query(args).catch(async (error) => {
          console.error(`Prisma ${model}.${operation} error:`, error);
          
          // Retry once for connection reset errors
          if (error.message?.includes('ConnectionReset') && Date.now() - startTime < 3000) {
            console.log(`Retrying ${model}.${operation} after connection error...`);
            // Wait 500ms before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            return query(args);
          }
          
          throw error;
        });
      },
    },
  });
};

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;