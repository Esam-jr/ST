import { useEffect, useState } from 'react';
import Link from 'next/link';

type TasksListProps = {
  userId?: string;
};

// Mock data for demo purposes
const mockTasks = [
  {
    id: '1',
    title: 'Complete pitch deck',
    description: 'Finalize the pitch deck for the investor meeting',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2025-04-18T10:00:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '2',
    title: 'Update financial projections',
    description: 'Revise the 5-year financial projections based on recent market analysis',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2025-04-25T14:30:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '3',
    title: 'Prepare for demo day',
    description: 'Create a product demonstration for the upcoming demo day',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2025-04-30T09:00:00Z',
    startupId: '2',
    startupName: 'HealthTech Innovations',
    assigneeId: 'user1',
  },
  {
    id: '4',
    title: 'Schedule customer interviews',
    description: 'Set up interviews with potential customers for market validation',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: '2025-04-10T11:00:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '5',
    title: 'Review competitor analysis',
    description: 'Review and update the competitor analysis document',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2025-04-20T16:00:00Z',
    startupId: '2',
    startupName: 'HealthTech Innovations',
    assigneeId: 'user1',
  },
];

export default function TasksList({ userId }: TasksListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch tasks from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Filter tasks by assignee
      const filteredTasks = userId ? mockTasks.filter(task => task.assigneeId === userId) : mockTasks;
      
      // Sort tasks by priority and due date
      const sortedTasks = [...filteredTasks].sort((a, b) => {
        // First sort by status (TODO and IN_PROGRESS before COMPLETED)
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        
        // Then sort by priority
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // Finally sort by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      setTasks(sortedTasks);
      setIsLoading(false);
    }, 800);
  }, [userId]);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = (dateString: string, status: string) => {
    if (status === 'COMPLETED') return false;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="flex animate-pulse flex-col gap-4 p-4">
          {[...Array(5)].map((_, index) => (
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

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          You don't have any tasks assigned to you at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Your Tasks</h3>
          <Link
            href="/tasks"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => (
            <li key={task.id}>
              <div className="block px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(
                        task.status
                      )}`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex sm:items-center">
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {task.startupName}
                    </p>
                    <span className="mx-2 hidden text-gray-500 sm:inline">·</span>
                    <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                      <span
                        className={`mr-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm sm:mt-0">
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
                    <p
                      className={`${
                        isOverdue(task.dueDate, task.status)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Due {formatDueDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {task.status === 'COMPLETED' ? 'View Details' : 'Update Status'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
        <div className="flex items-center justify-center">
          <Link
            href="/tasks/new"
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
            Create New Task
          </Link>
        </div>
      </div>
    </div>
  );
}
