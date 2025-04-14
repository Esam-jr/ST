import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the actual values of environment variables
  const githubClientId = process.env.GITHUB_ID || '';
  const githubClientSecret = process.env.GITHUB_SECRET || '';

  // Prepare debug information without exposing actual secrets
  const githubConfig = {
    clientId: {
      exists: !!githubClientId,
      prefix: githubClientId.substring(0, 5),
      suffix: githubClientId.substring(githubClientId.length - 5),
      length: githubClientId.length,
    },
    clientSecret: {
      exists: !!githubClientSecret,
      prefix: githubClientSecret.substring(0, 3),
      suffix: githubClientSecret.substring(githubClientSecret.length - 3),
      length: githubClientSecret.length,
    },
    callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/github`,
  };

  const nextAuthConfig = {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    environment: process.env.NODE_ENV,
  };

  return res.status(200).json({
    github: githubConfig,
    nextAuth: nextAuthConfig,
    message: "GitHub OAuth is configured correctly based on environment variables.",
  });
} 