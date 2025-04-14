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

// Get the actual values of environment variables
const googleClientId = process.env.GOOGLE_ID || '';
const googleClientSecret = process.env.GOOGLE_SECRET || '';
const githubClientId = process.env.GITHUB_ID || '';
const githubClientSecret = process.env.GITHUB_SECRET || '';

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
    try {
      // Check if user already exists first to avoid conflicts
      const existingUser = data.email 
        ? await prisma.user.findUnique({ where: { email: data.email } })
        : null;
      
      if (existingUser) {
        return existingUser;
      }

      // Create new user with USER role by default
      const user = await prisma.user.create({
        data: {
          name: data.name || null,
          email: data.email || '',  // Set a default empty string if email is undefined
          image: data.image || null,
          emailVerified: data.emailVerified || null,
          role: Role.USER,
        },
      });
      
      return user;
    } catch (error) {
      // If we got a unique constraint error, try to find the user
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && data.email) {
        const user = await prisma.user.findUnique({
          where: { email: data.email },
        });
        
        if (user) {
          return user;
        }
      }
      
      throw error;
    }
  },
  linkAccount: async (data: LinkAccountData) => {
    try {
      // Check if account already exists
      const existingAccount = await prisma.account.findFirst({
        where: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      });

      if (existingAccount) {
        return existingAccount;
      }

      // Create new account link
      const account = await prisma.account.create({ data });
      return account;
    } catch (error) {
      // If we got a unique constraint error, try to find the account
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const account = await prisma.account.findFirst({
          where: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        });
        
        if (account) {
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
        return null;
      }
      
      // Then get the user by ID
      return prisma.user.findUnique({
        where: { id: account.userId },
      });
    } catch (error) {
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
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
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
      // Check if this is an OAuth sign-in and the user has a USER role
      if (
        account && 
        (account.provider === 'google' || account.provider === 'github') && 
        user && 
        user.id
      ) {
        try {
          // Get the user from the database to check their role
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
          });
          
          // If user has a base USER role, they need to select a specific role
          if (dbUser?.role === Role.USER) {
            return true; // Allow sign in, and we'll redirect in the client
          }
        } catch (error) {
          console.error("Error checking user role in signIn callback:", error);
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Store the provider if available
      if (account) {
        token.provider = account.provider;
      }

      // If we have an email, get the user from the database
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            
            // Mark users with USER role as needing role selection
            if (dbUser.role === Role.USER) {
              token.needsRoleSelection = true;
            } else {
              token.needsRoleSelection = false;
            }
          } else {
            // Default to ENTREPRENEUR if no user found
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
        
        // Pass the needsRoleSelection flag to the client
        if (token.needsRoleSelection) {
          (session as any).needsRoleSelection = true;
        } else {
          (session as any).needsRoleSelection = false;
        }
        
        // Pass the provider to the client
        if (token.provider) {
          (session as any).provider = token.provider;
        }
      }
      
      return session;
    },
  }
};

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, authOptions);
export default authHandler;
