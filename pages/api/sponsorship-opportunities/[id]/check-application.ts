import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid opportunity ID' });
    }

    // Check for existing application
    const existingApplication = await prisma.sponsorshipApplication.findFirst({
      where: {
        opportunityId: id,
        sponsorId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });

    return res.status(200).json({ 
      hasApplied: !!existingApplication,
      application: existingApplication 
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return res.status(500).json({ message: 'Failed to check application status' });
  }
} 