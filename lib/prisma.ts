import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Add prisma to the NodeJS global type
interface CustomNodeJsGlobal {
  prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;

// Disconnect Prisma Client during Next.js Fast Refresh
if (process.env.NODE_ENV === 'development')
  if ((global as any)._preventConnectionLeaks !== true) {
    (global as any)._preventConnectionLeaks = true;
    
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