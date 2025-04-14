import { useSession, signIn, signOut } from 'next-auth/react';
import Layout from '../../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebug() {
  const { data: session, status } = useSession();

  return (
    <Layout title="Auth Debug | Startup Call Management System">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Status: {status}</CardTitle>
            <CardDescription>
              This page helps debug authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
              <div className="bg-muted p-4 rounded">
                <pre className="whitespace-pre-wrap">{JSON.stringify({ status }, null, 2)}</pre>
              </div>
            </div>

            {session && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Session Data</h2>
                <div className="bg-muted p-4 rounded overflow-auto max-h-64">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(session, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {!session ? (
                <>
                  <Button onClick={() => signIn('credentials', { callbackUrl: '/auth/debug' })}>
                    Sign in with Credentials
                  </Button>
                  <Button onClick={() => signIn('google', { callbackUrl: '/auth/debug' })}>
                    Sign in with Google
                  </Button>
                  <Button onClick={() => signIn('github', { callbackUrl: '/auth/debug' })}>
                    Sign in with GitHub
                  </Button>
                </>
              ) : (
                <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/auth/debug' })}>
                  Sign out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
            <CardDescription>
              Check that these values match your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h2 className="text-xl font-semibold mb-2">NextAuth.js URLs</h2>
              <ul className="space-y-2 mb-4">
                <li><strong>API Endpoint:</strong> /api/auth</li>
                <li><strong>Google Callback URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/google` : '[Loading...]'}</li>
                <li><strong>GitHub Callback URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/github` : '[Loading...]'}</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Make sure your OAuth provider callback URLs match the ones listed above</li>
                <li>Check if NEXTAUTH_URL is correctly set in .env file</li>
                <li>Verify that your OAuth client IDs and secrets are correct</li>
                <li>Ensure your OAuth application is properly configured and verified</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 