import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { Role } from '@prisma/client';
import { authOptions } from './[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST method is accepted
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user's session using getServerSession
    const session = await getServerSession(req, res, authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get the role from the request body
    const { role } = req.body;

    // Validate the role
    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Get the user's ID from the session
    const userId = session.user.id;

    // Update the user's role in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    // Return the updated user (excluding sensitive information)
    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 