import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import DashboardStats from '../../components/dashboard/DashboardStats';
import StartupList from '../../components/dashboard/StartupList';
import TasksList from '../../components/dashboard/TasksList';
import UpcomingEvents from '../../components/dashboard/UpcomingEvents';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Layout title="Loading | Dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600 mx-auto"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Loading...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null; // Will redirect in the useEffect
  }

  const userRole = session.user?.role || 'USER';

  return (
    <Layout title="Dashboard | Startup Call Management System">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white shadow dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
              <div>
                <Link
                  href="/submit"
                  className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Submit Startup
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Dashboard tabs */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('startups')}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'startups'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {userRole === 'ENTREPRENEUR' ? 'My Startups' : 'Startups'}
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'tasks'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Tasks
              </button>
              {userRole === 'SPONSOR' && (
                <button
                  onClick={() => setActiveTab('sponsorships')}
                  className={`border-b-2 py-4 px-1 text-sm font-medium ${
                    activeTab === 'sponsorships'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Sponsorships
                </button>
              )}
              {userRole === 'REVIEWER' && (
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`border-b-2 py-4 px-1 text-sm font-medium ${
                    activeTab === 'reviews'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Review Assignments
                </button>
              )}
              <button
                onClick={() => setActiveTab('events')}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Events
              </button>
            </nav>
          </div>

          {/* Dashboard content */}
          <div className="mt-6">
            {activeTab === 'overview' && <DashboardStats userRole={userRole} />}
            {activeTab === 'startups' && <StartupList userRole={userRole} userId={session.user?.id} />}
            {activeTab === 'tasks' && <TasksList userId={session.user?.id} />}
            {activeTab === 'events' && <UpcomingEvents />}
            {activeTab === 'sponsorships' && userRole === 'SPONSOR' && (
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Sponsorships</h2>
                <p className="text-gray-500 dark:text-gray-400">Coming soon.</p>
              </div>
            )}
            {activeTab === 'reviews' && userRole === 'REVIEWER' && (
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Assignments</h2>
                <p className="text-gray-500 dark:text-gray-400">Coming soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
