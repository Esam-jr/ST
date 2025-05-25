import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const userId = req.query.id as string;

  if (req.method === 'PATCH') {
    try {
      // Since we don't have a direct "disabled" field in the schema,
      // we'll set the role to USER and revoke all sessions
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'USER' },
      });

      // Delete all sessions for this user
      await prisma.session.deleteMany({
        where: { userId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error disabling user account:', error);
      return res.status(500).json({ error: 'Failed to disable user account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 