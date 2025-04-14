import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function RoleSelection() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    console.log("Role selection page - Session status:", status);
    console.log("Role selection page - User role:", session?.user?.role);
    console.log("Role selection page - Callback URL:", callbackUrl);
    
    if (status === 'unauthenticated') {
      console.log("User is unauthenticated, redirecting to signin");
      router.push('/auth/signin');
    }
    
    // If user already has a role other than USER, redirect to the callback URL or dashboard
    if (session?.user?.role && session.user.role !== 'USER') {
      console.log("User already has a non-USER role, redirecting to:", (callbackUrl as string) || '/dashboard');
      router.push((callbackUrl as string) || '/dashboard');
    }
  }, [status, session, router, callbackUrl]);

  const selectRole = async (role: 'ENTREPRENEUR' | 'SPONSOR') => {
    setIsLoading(true);
    setError('');

    try {
      console.log(`Selecting role: ${role}`);
      
      // Call the API to update the user's role
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      console.log("Role updated successfully, updating session...");

      // Update the session with the new role
      await update();
      
      console.log("Session updated, redirecting to:", (callbackUrl as string) || '/dashboard');
      
      // Redirect to the callback URL or dashboard
      router.push((callbackUrl as string) || '/dashboard');
    } catch (err) {
      console.error("Error selecting role:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <Layout title="Loading | Role Selection">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Select Your Role | Startup Call Management System">
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Select Your Role
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Tell us how you'd like to use the platform
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {error && (
            <div className="mb-6 p-4 text-sm border border-red-300 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle>Entrepreneur</CardTitle>
                <CardDescription>
                  I have a startup and want to get funding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => selectRole('ENTREPRENEUR')} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Select Entrepreneur'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <CardHeader>
                <CardTitle>Sponsor</CardTitle>
                <CardDescription>
                  I want to fund and support startups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => selectRole('SPONSOR')} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Select Sponsor'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 