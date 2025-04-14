import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the actual values of environment variables
  const googleClientId = process.env.GOOGLE_ID || '';
  const googleClientSecret = process.env.GOOGLE_SECRET || '';
  const githubClientId = process.env.GITHUB_ID || '';
  const githubClientSecret = process.env.GITHUB_SECRET || '';

  // Prepare debug information without exposing actual secrets
  const googleConfig = {
    clientId: {
      exists: !!googleClientId,
      prefix: googleClientId.substring(0, 5),
      suffix: googleClientId.substring(googleClientId.length - 5),
      length: googleClientId.length,
    },
    clientSecret: {
      exists: !!googleClientSecret,
      prefix: googleClientSecret.substring(0, 3),
      suffix: googleClientSecret.substring(googleClientSecret.length - 3),
      length: googleClientSecret.length,
    },
    callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
  };

  const nextAuthConfig = {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    environment: process.env.NODE_ENV,
  };

  return res.status(200).json({
    google: googleConfig,
    nextAuth: nextAuthConfig,
    message: "This information can help debug Google OAuth issues. Make sure the callback URL listed here matches exactly what you have in Google Cloud Console.",
  });
} 