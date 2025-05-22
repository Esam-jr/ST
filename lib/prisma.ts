import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 *
 * This solution addresses performance issues and the "prepared statement does not exist" error
 * by optimizing connection pooling and connection handling
 */

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Retry function with exponential backoff
 */
const retry = async (fn: () => Promise<any>, retries = 3, delay = 300) => {
  try {
    return await fn();
  } catch (error: any) {
    if (
      retries > 0 &&
      (error.message?.includes("ConnectionReset") ||
        error.message?.includes("prepared statement") ||
        error.message?.includes("statement does not exist") ||
        error.code === "26000")
    ) {
      console.log(
        `Retrying operation, ${retries} attempts left. Error: ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
};

// Create a more robust PrismaClient with better connection handling
class EnhancedPrismaClient extends PrismaClient {
  constructor(options?: any) {
    super(options);
  }

  // Override the $connect method to ensure proper connection
  async $connect() {
    try {
      await super.$connect();
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Error establishing database connection:', error);
      // Try to reconnect with a clean connection
      try {
        await this.$disconnect();
        await super.$connect();
        console.log('Database reconnection successful');
      } catch (reconnectError) {
        console.error('Failed to reconnect to database:', reconnectError);
        throw reconnectError; 
      }
    }
  }

  // Explicitly add a method to run a query with retries
  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return retry(operation, 3, 300);
  }
}

// Configure Prisma Client with connection pooling and better error handling
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add connection error handling
  client.$on('query', (e) => {
    console.log('Query:', e.query);
    console.log('Params:', e.params);
    console.log('Duration:', `${e.duration}ms`);
  });

  client.$on('error', (e) => {
    console.error('Prisma Error:', e);
  });

  // Handle connection issues
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error: any) {
      if (
        error.message?.includes('prepared statement') ||
        error.message?.includes('statement does not exist') ||
        error.code === '26000' ||
        error.code === '42P05'
      ) {
        console.log('Connection error detected, attempting to reconnect...');
        await client.$disconnect();
        await client.$connect();
        return next(params);
      }
      throw error;
    }
  });

  return client;
};

// Check if we already have an instance of PrismaClient and reuse it if we're in development
const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
