import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EnvDebug() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkEnvironment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/check-env');
      const data = await response.json();
      setEnvStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Environment Debug | Startup Call Management System">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Debug</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Check Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm mb-4">
                This page helps debug environment variable issues. Press the button below to check if 
                your OAuth credentials are correctly loaded from the .env file.
              </p>
              <Button 
                onClick={checkEnvironment}
                disabled={isLoading}
              >
                {isLoading ? 'Checking...' : 'Check Environment Variables'}
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-4 text-sm border border-red-300 bg-red-50 text-red-800 rounded-md">
                {error}
              </div>
            )}

            {envStatus && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded">
                    <h3 className="font-medium mb-2">OAuth Credentials</h3>
                    <ul className="space-y-2">
                      <li>
                        <span className="font-medium">GOOGLE_ID:</span>{' '}
                        {envStatus.googleId ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                      <li>
                        <span className="font-medium">GOOGLE_SECRET:</span>{' '}
                        {envStatus.googleSecret ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                      <li>
                        <span className="font-medium">GITHUB_ID:</span>{' '}
                        {envStatus.githubId ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                      <li>
                        <span className="font-medium">GITHUB_SECRET:</span>{' '}
                        {envStatus.githubSecret ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                    </ul>
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <h3 className="font-medium mb-2">NextAuth Configuration</h3>
                    <ul className="space-y-2">
                      <li>
                        <span className="font-medium">NEXTAUTH_URL:</span>{' '}
                        {envStatus.nextAuthUrl ? 
                          <span className="text-green-600">✓ Available ({envStatus.nextAuthUrl})</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                      <li>
                        <span className="font-medium">NEXTAUTH_SECRET:</span>{' '}
                        {envStatus.nextAuthSecret ? 
                          <span className="text-green-600">✓ Available</span> : 
                          <span className="text-red-600">✗ Missing</span>}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Make sure your .env file is in the root directory of your project</li>
              <li>Verify that your .env file has the correct format (no spaces around the equals sign)</li>
              <li>Ensure there are no typos in the variable names (they are case-sensitive)</li>
              <li>Restart your development server after making changes to the .env file</li>
              <li>If using Docker or another containerization tool, make sure environment variables are properly passed to the container</li>
              <li>Check if you have multiple .env files (.env.local, .env.development, etc.) that might be overriding each other</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 