import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check environment variables without exposing actual values
  const envStatus = {
    googleId: !!process.env.GOOGLE_ID,
    googleSecret: !!process.env.GOOGLE_SECRET,
    githubId: !!process.env.GITHUB_ID,
    githubSecret: !!process.env.GITHUB_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || null,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    
    // For debugging only - print first 5 chars of IDs to help verify without exposing full credentials
    googleIdPrefix: process.env.GOOGLE_ID?.substring(0, 5) || null,
    githubIdPrefix: process.env.GITHUB_ID?.substring(0, 5) || null,
    
    // Add NODE_ENV to check which environment we're in
    nodeEnv: process.env.NODE_ENV
  };

  return res.status(200).json(envStatus);
} 