import prisma from "./prisma";

/**
 * Error-handling wrapper for Prisma operations
 * Uses a simplified error handling approach
 */

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // milliseconds

// Detect a connection error
function isConnectionError(error: any): boolean {
  if (!error || !error.message) return false;
  return (
    error.message.includes("Connection") ||
    error.message.includes("timeout") ||
    error.message.includes("connection") ||
    error.message.includes("prepared statement") ||
    (error.code && (error.code.startsWith("P") || error.code === "42P05" || error.code === "26000"))
  );
}

// Handle connection reset for the Prisma client
async function resetPrismaConnection() {
  try {
    await prisma.$disconnect();

    // Wait before reconnecting
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    await prisma.$connect();

    console.log("Prisma connection reset successfully");
  } catch (err) {
    console.error("Failed to reset Prisma connection:", err);
    throw err;
  }
}

/**
 * Executes a Prisma operation with automatic retry for connection errors
 * @param operation - The async function that performs a Prisma operation
 * @returns The result of the operation
 */
export async function withPrisma<T>(operation: () => Promise<T>): Promise<T> {
  let retries = 0;
  let lastError: any = null;

  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        // Add exponential backoff delay before retrying
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const result = await operation();

      // If operation succeeded after retries, log success
      if (retries > 0) {
        console.log(`Operation succeeded after ${retries} retries`);
      }

      return result;

    } catch (error: any) {
      lastError = error;
      console.error(`Database operation error (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);

      if (isConnectionError(error)) {
        if (retries < MAX_RETRIES) {
          console.log(`Connection error detected. Retry ${retries + 1}/${MAX_RETRIES}...`);

          try {
            await resetPrismaConnection();
          } catch (resetError) {
            console.error("Failed to reset connection during retry:", resetError);
            // If we can't reset the connection, wait longer before the next retry
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          retries++;
          continue;
        }
      }

      // For other errors or if we've exceeded retries, rethrow
      throw error;
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

export default withPrisma;
