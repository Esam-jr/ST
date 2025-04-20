import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

/**
 * This endpoint is deprecated and can be removed.
 * The main startup-calls endpoint and [id] endpoint now handle public access appropriately
 * by checking the session and applying the correct visibility rules.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this public endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get only published startup calls
    const publishedCalls = await prisma.startupCall.findMany({
      where: {
        status: 'PUBLISHED'
      },
      orderBy: {
        publishedDate: 'desc'
      }
    });

    return res.status(200).json(publishedCalls);
  } catch (error) {
    console.error('Error fetching public startup calls:', error);
    return res.status(500).json({ message: 'Error fetching startup calls' });
  }
} 