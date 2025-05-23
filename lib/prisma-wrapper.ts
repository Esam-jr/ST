import prisma from "./prisma";

/**
 * Error-handling wrapper for Prisma operations
 * Automatically retries operations that fail with prepared statement errors
 */

// Number of retry attempts
const MAX_RETRIES = 3;

// Detect a prepared statement error
function isPreparedStatementError(error: any): boolean {
  if (!error || !error.message) return false;

  return (
    error.message.includes("prepared statement") ||
    error.message.includes("statement does not exist") ||
    (error.code && error.code === "26000")
  );
}

// Detect a connection error
function isConnectionError(error: any): boolean {
  if (!error || !error.message) return false;

  return (
    error.message.includes("Connection") ||
    error.message.includes("timeout") ||
    error.message.includes("connection")
  );
}

// Handle connection reset for the Prisma client
async function resetPrismaConnection() {
  try {
    // Disconnect fully
    await prisma.$disconnect();

    // Wait a bit before reconnecting
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Attempt to verify connection is working with a simple query
    await prisma.$executeRaw`SELECT 1`;

    console.log("Prisma connection reset successfully after error");
  } catch (err) {
    console.error("Failed to reset Prisma connection:", err);
    // If we fail to reset, try one more time after a longer delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await prisma.$disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (innerErr) {
      console.error("Final connection reset attempt failed:", innerErr);
    }
  }
}

/**
 * Executes a Prisma operation with automatic retry for prepared statement errors
 * @param operation - The async function that performs a Prisma operation
 * @returns The result of the operation
 */
export async function withPrisma<T>(operation: () => Promise<T>): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      // If we have a prepared statement error or connection error and haven't exceeded retries
      if (
        (isPreparedStatementError(error) || isConnectionError(error)) &&
        retries < MAX_RETRIES
      ) {
        console.log(
          `Database error detected. Retry ${retries + 1}/${MAX_RETRIES}...`
        );

        // Increment retry counter
        retries++;

        // Reset the connection
        await resetPrismaConnection();

        // Wait a bit before retrying (exponential backoff)
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, retries)));

        // Continue to retry
        continue;
      }

      // For other errors or if we've exceeded retries, rethrow
      throw error;
    }
  }
}

export default withPrisma;
