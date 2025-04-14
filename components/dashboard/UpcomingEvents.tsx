import { useEffect, useState } from 'react';
import Link from 'next/link';

// Mock data for demo purposes
const mockEvents = [
  {
    id: '1',
    title: 'Startup Pitch Competition',
    description: 'Present your startup idea to a panel of judges and investors for a chance to win funding.',
    startDate: '2025-04-25T13:00:00Z',
    endDate: '2025-04-25T17:00:00Z',
    location: 'Innovation Hub, San Francisco',
    eventUrl: 'https://example.com/events/pitch-competition',
    isPublic: true,
  },
  {
    id: '2',
    title: 'Investor Networking Mixer',
    description: 'Network with potential investors and other entrepreneurs in a casual setting.',
    startDate: '2025-05-10T18:00:00Z',
    endDate: '2025-05-10T21:00:00Z',
    location: 'Tech Lounge, New York',
    eventUrl: 'https://example.com/events/investor-mixer',
    isPublic: true,
  },
  {
    id: '3',
    title: 'Startup Funding Workshop',
    description: 'Learn about different funding options and how to prepare for fundraising.',
    startDate: '2025-05-15T10:00:00Z',
    endDate: '2025-05-15T16:00:00Z',
    location: 'Online Webinar',
    eventUrl: 'https://example.com/events/funding-workshop',
    isPublic: true,
  },
  {
    id: '4',
    title: 'Demo Day',
    description: 'Showcase your startup product to the community and potential customers.',
    startDate: '2025-06-05T09:00:00Z',
    endDate: '2025-06-05T17:00:00Z',
    location: 'Convention Center, Austin',
    eventUrl: 'https://example.com/events/demo-day',
    isPublic: true,
  },
  {
    id: '5',
    title: 'Startup Call Q2 Deadline',
    description: 'Last day to submit your startup idea for the Q2 funding cycle.',
    startDate: '2025-06-30T23:59:59Z',
    endDate: '2025-06-30T23:59:59Z',
    location: 'Online Submission',
    eventUrl: 'https://example.com/submit',
    isPublic: true,
  },
];

export default function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch events from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Sort events by date (upcoming first)
      const today = new Date();
      const sortedEvents = [...mockEvents]
        .filter(event => new Date(event.startDate) >= today)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 4); // Show only the next 4 events
      
      setEvents(sortedEvents);
      setIsLoading(false);
    }, 800);
  }, []);

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const isSameDay = start.toDateString() === end.toDateString();
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    
    if (isSameDay) {
      return `${start.toLocaleDateString('en-US', dateOptions)} • ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
    } else {
      return `${start.toLocaleDateString('en-US', dateOptions)} - ${end.toLocaleDateString('en-US', dateOptions)}`;
    }
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="flex animate-pulse flex-col gap-4 p-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="mb-2 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
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

  if (events.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No upcoming events</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          There are no events scheduled at the moment. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Upcoming Events</h3>
          <Link
            href="/events"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event) => (
            <li key={event.id}>
              <Link href={event.eventUrl} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-primary-600 dark:text-primary-400">
                      {event.title}
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          getDaysUntil(event.startDate) === 'Today'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : getDaysUntil(event.startDate) === 'Tomorrow'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {getDaysUntil(event.startDate)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {event.description.length > 120
                          ? `${event.description.substring(0, 120)}...`
                          : event.description}
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatEventDate(event.startDate, event.endDate)}
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {event.location}
                      </p>
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
            href="/events/calendar"
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-400 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            View Calendar
          </Link>
        </div>
      </div>
    </div>
  );
}
