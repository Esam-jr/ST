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

// Configure Prisma Client with better connection handling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
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
        return retry(async () => {
          try {
            return await query(args);
          } catch (error: any) {
            console.error(`Prisma ${model}.${operation} error:`, error);
            throw error;
          }
        });
      },
    },
  });
};

// Check if we already have an instance of PrismaClient and reuse it if we're in development
const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
