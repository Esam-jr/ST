import React from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type StartupOverviewProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
};

export default function StartupOverview({ startup, isFounder, isAdmin }: StartupOverviewProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate average rating if there are reviews
  const avgRating = startup.reviews?.length 
    ? (startup.reviews.reduce((sum: number, review: any) => sum + review.score, 0) / startup.reviews.length).toFixed(1)
    : 'N/A';
  
  // Calculate total funding from sponsorships
  const totalFunding = startup.sponsorships?.reduce((sum: number, sponsorship: any) => {
    return sum + (sponsorship.amount || 0);
  }, 0);

  // Calculate progress percentage for milestones
  const completedMilestones = startup.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0;
  const totalMilestones = startup.milestones?.length || 0;
  const milestoneProgress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  // Prepare data for charts
  const reviewScoresData = {
    labels: ['Innovation', 'Market Potential', 'Team', 'Execution', 'Overall'],
    datasets: [
      {
        label: 'Average Scores',
        data: [8.2, 7.5, 8.8, 7.9, avgRating === 'N/A' ? 0 : parseFloat(avgRating)],
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3 dark:bg-primary-900">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{avgRating}</div>
                    <div className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">/ 10</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3 dark:bg-primary-900">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Funding</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      ${totalFunding.toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3 dark:bg-primary-900">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Milestone Progress</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{milestoneProgress}%</div>
                    <div className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {completedMilestones} of {totalMilestones}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3 dark:bg-primary-900">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Days Active</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {Math.floor((new Date().getTime() - new Date(startup.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left column - Startup details */}
        <div className="space-y-8">
          {/* Description */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Description</h2>
              <div className="mt-2 text-gray-600 dark:text-gray-300">{startup.description}</div>
            </div>
          </div>

          {/* Pitch */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Elevator Pitch</h2>
              <div className="mt-2 whitespace-pre-line text-gray-600 dark:text-gray-300">{startup.pitch}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Timeline</h2>
              <div className="mt-3 flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 ring-8 ring-white dark:bg-primary-900 dark:text-primary-300 dark:ring-gray-800">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Startup created</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(startup.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  {startup.status !== 'DRAFT' && (
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-8 ring-white dark:bg-blue-900 dark:text-blue-300 dark:ring-gray-800">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Submitted for review</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(startup.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}
                  {(startup.status === 'UNDER_REVIEW' || startup.status === 'ACCEPTED' || startup.status === 'REJECTED') && (
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 ring-8 ring-white dark:bg-yellow-900 dark:text-yellow-300 dark:ring-gray-800">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Under review</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {/* This would be a real date in a production app */}
                              {formatDate(new Date(new Date(startup.updatedAt).getTime() + 86400000).toISOString())}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}
                  {(startup.status === 'ACCEPTED' || startup.status === 'REJECTED') && (
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-800 ${
                              startup.status === 'ACCEPTED' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {startup.status === 'ACCEPTED' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                )}
                              </svg>
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {startup.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {/* This would be a real date in a production app */}
                              {formatDate(new Date(new Date(startup.updatedAt).getTime() + 172800000).toISOString())}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Charts and founder info */}
        <div className="space-y-8">
          {/* Founder information */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Founder</h2>
              <div className="mt-3 flex items-center">
                {startup.founder?.image ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={startup.founder.image}
                    alt={`${startup.founder.name} avatar`}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {startup.founder?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="ml-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">{startup.founder?.name}</h3>
                  {isFounder || isAdmin ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{startup.founder?.email}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Review scores chart - Only show if there are reviews */}
          {startup.reviews?.length > 0 && (
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Review Scores</h2>
                <div className="mt-4 h-64">
                  <Chart type="radar" data={reviewScoresData} />
                </div>
              </div>
            </div>
          )}

          {/* Industry and Stage */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Classification</h2>
              <div className="mt-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {startup.industry?.map((ind: string) => (
                      <span 
                        key={ind}
                        className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-gray-700">
                  <div className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage</span>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">{startup.stage}</span>
                </div>
                {startup.website && (
                  <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-gray-700">
                    <div className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</span>
                    </div>
                    <a 
                      href={startup.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      {startup.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
