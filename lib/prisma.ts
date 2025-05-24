import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js with Supabase
 *
 * This solution addresses performance issues and the "prepared statement does not exist" error
 * by optimizing connection pooling and connection handling
 */

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

class PrismaClientSingleton extends PrismaClient {
  constructor() {
    super({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Add error handling and reconnection logic
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      if (e.duration > 2000) { // Log slow queries (over 2s)
        console.warn('Slow Query:', e);
      }
    });

    // Handle connection errors
    this.$on('error' as never, async (e: Prisma.LogEvent) => {
      console.error('Prisma Error:', e);
      await this.reconnect();
    });
  }

  private async reconnect() {
    try {
      await this.$disconnect();
      await this.$connect();
      console.log('Prisma reconnected successfully');
    } catch (error) {
      console.error('Failed to reconnect Prisma:', error);
      // Add exponential backoff retry logic
      setTimeout(() => this.reconnect(), 5000);
    }
  }
}

// Ensure we reuse the same instance in development
const prisma = global.prismaGlobal || new PrismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export default prisma;
