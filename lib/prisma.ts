import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PrismaClient Singleton Implementation for Next.js
 * Uses a simplified connection management strategy
 */

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: [{ level: 'error', emit: 'event' }],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
};

export class PrismaClientSingleton extends PrismaClient {
  private static instance: PrismaClientSingleton;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;

  constructor() {
    super(prismaClientOptions);

    this.$on('error' as never, async (e: Prisma.LogEvent) => {
      console.error('Prisma Error:', e);
      await this.reconnect();
    });
  }

  public static getInstance(): PrismaClientSingleton {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClientSingleton();
    }
    return PrismaClientSingleton.instance;
  }

  private async reconnect() {
    try {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        return;
      }

      this.reconnectAttempts++;
      
      if (this.isConnected) {
      await this.$disconnect();
      }

      // Add delay before reconnecting (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      await this.$connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Prisma reconnected successfully');
    } catch (error) {
      console.error('Failed to reconnect Prisma:', error);
      this.isConnected = false;
      // Try reconnecting again with exponential backoff
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  public async connect() {
    if (!this.isConnected) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('Failed to connect:', error);
        await this.reconnect();
      }
    }
  }

  public async $disconnect() {
    if (this.isConnected) {
      try {
        await super.$disconnect();
        this.isConnected = false;
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }
}

// Use singleton pattern to ensure single instance
const prisma = global.prismaGlobal || PrismaClientSingleton.getInstance();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

// Ensure proper cleanup on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
