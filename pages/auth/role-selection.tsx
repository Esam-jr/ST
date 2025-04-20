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
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    
    // If user already has a role other than USER, redirect based on their role
    if (session?.user?.role && session.user.role !== 'USER') {
      if (session.user.role === 'ENTREPRENEUR') {
        router.push('/startup-calls');
      } else if (session.user.role === 'SPONSOR') {
        router.push('/sponsor-dashboard');
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push((callbackUrl as string) || '/profile');
      }
    }
  }, [status, session, router, callbackUrl]);

  const selectRole = async (role: 'ENTREPRENEUR' | 'SPONSOR') => {
    setIsLoading(true);
    setError('');

    try {
      // Call the API to update the user's role
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      // Update the session with the new role
      await update();
      
      // Redirect based on selected role
      if (role === 'ENTREPRENEUR') {
        router.push('/startup-calls');
      } else if (role === 'SPONSOR') {
        router.push('/sponsor-dashboard');
      } else {
        router.push((callbackUrl as string) || '/profile');
      }
    } catch (err) {
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