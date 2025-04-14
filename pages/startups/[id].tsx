import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout/Layout';
import StartupHeader from '../../components/startups/StartupHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import StartupTabs from '../../components/startups/StartupTabs';

export default function StartupDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch startup data when ID is available
    const fetchStartupData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/startups/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Startup not found');
          } else if (response.status === 403) {
            setError('You do not have permission to view this startup');
          } else {
            setError('Failed to load startup details');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setStartup(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching startup:', err);
        setError('An error occurred while loading the startup details');
        setLoading(false);
      }
    };

    if (id) {
      fetchStartupData();
    }
  }, [id]);

  // If not signed in, show sign-in prompt
  if (status === 'unauthenticated') {
    return (
      <Layout title="Sign In Required | Startup Call Management System">
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Sign In Required</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Please sign in to view startup details.
            </p>
            <button
              onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/startups/${id}`)}`)}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Layout title="Loading... | Startup Call Management System">
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner message="Loading startup details..." />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout title="Error | Startup Call Management System">
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ErrorAlert
            title="Error Loading Startup"
            message={error}
            actionText="Go Back"
            onAction={() => router.back()}
          />
        </div>
      </Layout>
    );
  }

  // If startup data is loaded successfully
  if (startup) {
    return (
      <Layout title={`${startup.name} | Startup Call Management System`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header with startup info and actions */}
          <StartupHeader
            startup={startup}
            isOwner={session?.user?.id === startup.founderId}
            isAdmin={session?.user?.role === 'ADMIN'}
          />

          {/* Tab navigation and content */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <StartupTabs
              startup={startup}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              userRole={session?.user?.role}
              userId={session?.user?.id}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Fallback if startup is null but no error/loading state
  return null;
}
