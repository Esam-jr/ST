import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Layout from '../../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GoogleDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Check environment variables first
      const envResponse = await fetch('/api/auth/check-env');
      const envData = await envResponse.json();
      setEnvInfo(envData);
      
      // Directly call the Google provider with callback URL to this page
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/auth/google-debug' 
      });
      
      setResponse(result);
      
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/debug-google');
      const data = await response.json();
      setEnvInfo(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/auth/callback/google`;
    }
    return '[Loading...]';
  };

  return (
    <Layout title="Google OAuth Debug | Startup Call Management System">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Debug</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Google OAuth Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
              >
                {isLoading ? 'Testing...' : 'Test Google Sign In'}
              </Button>
              
              <Button 
                onClick={checkGoogle}
                variant="outline" 
                disabled={isLoading}
              >
                Check Google Config
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 text-sm border border-red-300 bg-red-50 text-red-800 rounded-md">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {envInfo && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
                <div className="bg-muted p-4 rounded overflow-auto max-h-64">
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(envInfo, null, 2)}</pre>
                </div>
              </div>
            )}

            {response && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Response</h2>
                <div className="bg-muted p-4 rounded overflow-auto max-h-64">
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(response, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Google OAuth Callback URL</h2>
                <p className="text-sm mb-1">
                  Make sure this exact URL is configured in your Google Cloud Console:
                </p>
                <div className="bg-muted p-3 rounded border text-sm font-mono">
                  {getCallbackUrl()}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Common Issues</h2>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>
                    <strong>Invalid Client Error (401):</strong> Your client ID or secret is incorrect, or the OAuth client is not properly configured in Google Cloud Console
                  </li>
                  <li>
                    <strong>Redirect URI Mismatch:</strong> The callback URL in your Google Cloud Console does not exactly match the one shown above
                  </li>
                  <li>
                    <strong>OAuth Consent Screen Not Configured:</strong> You need to configure the OAuth consent screen in Google Cloud Console
                  </li>
                  <li>
                    <strong>Project Not Published:</strong> Your Google Cloud project may still be in "Testing" mode and not published
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Debugging Steps</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Verify your Google Cloud Console OAuth configuration</li>
                  <li>Check that your client ID and secret match those in your .env file</li>
                  <li>Make sure the redirect URI (callback URL) exactly matches</li>
                  <li>Verify that your Google Cloud project and OAuth consent screen are properly configured</li>
                  <li>Check if you need to add test users for your app (if in testing mode)</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 