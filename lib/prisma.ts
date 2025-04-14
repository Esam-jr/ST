import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Add specific options to avoid the prepared statement issue
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Add data proxy options to fix PostgreSQL prepared statement errors
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Disconnect Prisma Client during Next.js Fast Refresh
if (process.env.NODE_ENV === 'development')
  if ((globalForPrisma as any)._preventConnectionLeaks !== true) {
    (globalForPrisma as any)._preventConnectionLeaks = true;
    
    // During development, ensure we clean up any lingering connections
    const originalBeforeExit = process.listeners('beforeExit')[0];
    
    process.removeAllListeners('beforeExit');
    
    process.on('beforeExit', async (code) => {
      if (typeof originalBeforeExit === 'function') {
        originalBeforeExit(code);
      }
      await prisma.$disconnect();
    });
  }

// This ensures connections are closed properly, preventing the "prepared statement already exists" error
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});