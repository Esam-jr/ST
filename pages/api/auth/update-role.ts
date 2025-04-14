import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { Role } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST method is accepted
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log("Update role API - Request body:", req.body);
    
    // Get the user's session using getServerSession
    const session = await getServerSession(req, res, authOptions);
    console.log("Update role API - Session:", session ? "Session exists" : "No session");
    
    // Check if the user is authenticated
    if (!session || !session.user) {
      console.log("Update role API - Unauthorized: No valid session or user");
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log("Update role API - User from session:", session.user);
    
    // Get the role from the request body
    const { role } = req.body;
    console.log("Update role API - Requested role:", role);

    // Validate the role
    if (!role || !Object.values(Role).includes(role as Role)) {
      console.log("Update role API - Invalid role:", role);
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Get the user's ID from the session
    const userId = session.user.id;
    console.log("Update role API - User ID:", userId);

    // Update the user's role in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    console.log("Update role API - Successfully updated user role:", updatedUser.role);

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