import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { hash } from 'bcrypt';
import withPrisma from '@/lib/prisma-wrapper';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized. Only admins can create reviewers.' });
    }

    const { name, email, password, expertise = [] } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure password is at least 6 characters long
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await withPrisma(() => 
      prisma.user.findUnique({
        where: { email },
      })
    );

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create reviewer
    const reviewer = await withPrisma(() => 
      prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: Role.REVIEWER,
        },
      })
    );

    // Remove password from response for security
    const { password: _, ...reviewerWithoutPassword } = reviewer;

    return res.status(201).json({
      message: 'Reviewer created successfully',
      reviewer: reviewerWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating reviewer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 