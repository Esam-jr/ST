import { useEffect, useState } from 'react';
import Link from 'next/link';

type StartupListProps = {
  userRole: string;
  userId?: string;
};

// Mock data for demo purposes
const mockStartups = [
  {
    id: '1',
    name: 'EcoTech Solutions',
    description: 'Sustainable technology solutions for reducing carbon footprint in urban environments.',
    industry: ['CleanTech', 'Sustainability'],
    stage: 'Seed',
    status: 'ACCEPTED',
    score: 8.5,
    createdAt: '2025-03-15T10:30:00Z',
    founder: {
      id: 'user1',
      name: 'Jessica Smith',
    },
  },
  {
    id: '2',
    name: 'HealthTech Innovations',
    description: 'AI-powered healthcare diagnostics for early disease detection.',
    industry: ['HealthTech', 'AI'],
    stage: 'Series A',
    status: 'ACCEPTED',
    score: 9.2,
    createdAt: '2025-02-20T15:45:00Z',
    founder: {
      id: 'user1',
      name: 'Jessica Smith',
    },
  },
  {
    id: '3',
    name: 'EdTech Pioneers',
    description: 'Virtual reality educational platform for immersive learning experiences.',
    industry: ['EdTech', 'VR/AR'],
    stage: 'Pre-seed',
    status: 'UNDER_REVIEW',
    score: 7.8,
    createdAt: '2025-04-05T09:15:00Z',
    founder: {
      id: 'user2',
      name: 'Michael Thomas',
    },
  },
  {
    id: '4',
    name: 'FinTech Revolution',
    description: 'Blockchain-based payment system for secure cross-border transactions.',
    industry: ['FinTech', 'Blockchain'],
    stage: 'Seed',
    status: 'SUBMITTED',
    score: null,
    createdAt: '2025-04-10T14:20:00Z',
    founder: {
      id: 'user3',
      name: 'Ava Johnson',
    },
  },
  {
    id: '5',
    name: 'AgroTech Solutions',
    description: 'Smart farming technology using IoT sensors and data analytics.',
    industry: ['AgTech', 'IoT'],
    stage: 'Pre-seed',
    status: 'ACCEPTED',
    score: 8.9,
    createdAt: '2025-03-25T11:10:00Z',
    founder: {
      id: 'user4',
      name: 'David Brown',
    },
  },
];

export default function StartupList({ userRole, userId }: StartupListProps) {
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Filter startups based on user role
      let filteredStartups = [...mockStartups];
      
      if (userRole === 'ENTREPRENEUR' && userId) {
        filteredStartups = mockStartups.filter(startup => startup.founder.id === userId);
      }
      
      setStartups(filteredStartups);
      setIsLoading(false);
    }, 800);
  }, [userRole, userId]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="flex animate-pulse flex-col gap-4 p-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="mb-2 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex justify-between">
                <div className="h-3 w-1/5 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-1/5 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No startups found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {userRole === 'ENTREPRENEUR' ? (
            <>
              You haven't submitted any startup ideas yet.{' '}
              <Link href="/submit" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Submit your first idea
              </Link>
            </>
          ) : (
            'There are no startups available at the moment.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            {userRole === 'ENTREPRENEUR' ? 'My Startups' : 'All Startups'}
          </h3>
          <Link
            href="/startups"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {startups.map((startup) => (
            <li key={startup.id}>
              <Link href={`/startups/${startup.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-medium text-primary-600 dark:text-primary-400">
                      {startup.name}
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(
                          startup.status
                        )}`}
                      >
                        {startup.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {startup.description.length > 120
                          ? `${startup.description.substring(0, 120)}...`
                          : startup.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {startup.industry.join(', ')}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                        <svg
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        {startup.stage}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                      {startup.score ? (
                        <div className="flex items-center">
                          <svg
                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{startup.score.toFixed(1)}/10</span>
                        </div>
                      ) : (
                        <p>Not yet rated</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
        <div className="flex items-center justify-center">
          <Link
            href="/submit"
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-400 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit New Startup
          </Link>
        </div>
      </div>
    </div>
  );
}
