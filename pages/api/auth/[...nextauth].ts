import { NextApiHandler } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from '../../../lib/prisma';
import { compare } from 'bcrypt';
import { Role, Prisma } from '@prisma/client';
import { AdapterUser } from 'next-auth/adapters';

// Log environment variables to help with debugging
console.log('Environment check for OAuth providers:');
console.log('GOOGLE_ID exists:', !!process.env.GOOGLE_ID);
console.log('GOOGLE_SECRET exists:', !!process.env.GOOGLE_SECRET);
console.log('GITHUB_ID exists:', !!process.env.GITHUB_ID);
console.log('GITHUB_SECRET exists:', !!process.env.GITHUB_SECRET);

// Get the actual values of environment variables
const googleClientId = process.env.GOOGLE_ID || '';
const googleClientSecret = process.env.GOOGLE_SECRET || '';
const githubClientId = process.env.GITHUB_ID || '';
const githubClientSecret = process.env.GITHUB_SECRET || '';

// Log the first few characters to verify they're loaded correctly
console.log('GOOGLE_ID prefix:', googleClientId.substring(0, 5));
console.log('GITHUB_ID prefix:', githubClientId.substring(0, 5));

// User data type for createUser
type CreateUserData = {
  name?: string;
  email?: string;
  image?: string;
  emailVerified?: Date;
};

// Account data type for linkAccount
type LinkAccountData = {
  provider: string;
  providerAccountId: string;
  userId: string;
  type: string;
  [key: string]: any;
};

// Create a custom PrismaAdapter with completely custom handling for GitHub OAuth
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: CreateUserData) => {
    console.log("Creating new user with data:", { ...data, email: data.email });
    try {
      // Check if user already exists first to avoid conflicts
      const existingUser = data.email 
        ? await prisma.user.findUnique({ where: { email: data.email } })
        : null;
      
      if (existingUser) {
        console.log("User already exists, returning existing user:", existingUser.id);
        return existingUser;
      }

      // Create new user with ENTREPRENEUR role by default
      const user = await prisma.user.create({
        data: {
          ...data,
          role: Role.ENTREPRENEUR,
        },
      });
      
      console.log("Successfully created new user:", user.id);
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      
      // If we got a unique constraint error, try to find the user
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && data.email) {
        console.log("Unique constraint error, trying to find existing user");
        const user = await prisma.user.findUnique({
          where: { email: data.email },
        });
        
        if (user) {
          console.log("Found existing user:", user.id);
          return user;
        }
      }
      
      throw error;
    }
  },
  linkAccount: async (data: LinkAccountData) => {
    console.log("Linking account:", { provider: data.provider, providerAccountId: data.providerAccountId });
    try {
      // Check if account already exists
      const existingAccount = await prisma.account.findFirst({
        where: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      });

      if (existingAccount) {
        console.log("Account already exists, returning existing:", existingAccount.id);
        return existingAccount;
      }

      // Create new account link
      const account = await prisma.account.create({ data });
      console.log("Successfully linked account:", account.id);
      return account;
    } catch (error) {
      console.error("Error in linkAccount:", error);
      
      // If we got a unique constraint error, try to find the account
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        console.log("Unique constraint error, trying to find existing account");
        const account = await prisma.account.findFirst({
          where: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        });
        
        if (account) {
          console.log("Found existing account:", account.id);
          return account;
        }
      }
      
      throw error;
    }
  },
  getUserByAccount: async (providerAccountId: { provider: string, providerAccountId: string }) => {
    try {
      // First try to find the account
      const account = await prisma.account.findFirst({
        where: {
          provider: providerAccountId.provider,
          providerAccountId: providerAccountId.providerAccountId,
        },
      });
      
      if (!account) {
        console.log("Account not found for:", providerAccountId);
        return null;
      }
      
      // Then get the user by ID
      return prisma.user.findUnique({
        where: { id: account.userId },
      });
    } catch (error) {
      console.error("Error in getUserByAccount:", error);
      return null;
    }
  }
};

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    newUser: '/auth/signup',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in callback running for:", user.email);
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // If we don't have a role yet but have an email, try to get it from the database
      if (!token.role && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser?.role) {
            token.role = dbUser.role;
          } else {
            // Default to ENTREPRENEUR if no role found
            token.role = 'ENTREPRENEUR';
          }
        } catch (error) {
          console.error("Error fetching user role for JWT:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string || 'ENTREPRENEUR';
      }
      return session;
    },
  }
};

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, authOptions);
export default authHandler;
