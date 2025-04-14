import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type Milestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  startupId: string;
  createdAt: string;
  updatedAt: string;
};

type StartupMilestonesProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
};

export default function StartupMilestones({ startup, isFounder, isAdmin }: StartupMilestonesProps) {
  const queryClient = useQueryClient();
  
  // State for form and editing
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'>('PENDING');
  const [error, setError] = useState('');

  // Fetch milestones
  const { data: milestones, isLoading, isError } = useQuery(
    ['milestones', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/milestones`);
      if (!res.ok) throw new Error('Failed to fetch milestones');
      return res.json();
    },
    {
      initialData: startup.milestones || [],
      enabled: !startup.milestones
    }
  );

  // Create/update milestone mutation
  const milestoneMutation = useMutation(
    async (milestoneData: any) => {
      const method = editingMilestone ? 'PUT' : 'POST';
      const url = editingMilestone 
        ? `/api/startups/${startup.id}/milestones/${editingMilestone.id}`
        : `/api/startups/${startup.id}/milestones`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save milestone');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries(['milestones', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation(
    async (milestoneId: string) => {
      const res = await fetch(`/api/startups/${startup.id}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete milestone');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Update milestone status mutation
  const updateStatusMutation = useMutation(
    async ({ milestoneId, newStatus }: { milestoneId: string; newStatus: string }) => {
      const res = await fetch(`/api/startups/${startup.id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update milestone status');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['milestones', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('PENDING');
    setEditingMilestone(null);
    setShowMilestoneForm(false);
    setError('');
  };

  // Handle milestone edit
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description);
    setDueDate(new Date(milestone.dueDate).toISOString().split('T')[0]);
    setStatus(milestone.status);
    setShowMilestoneForm(true);
  };

  // Handle milestone delete
  const handleDeleteMilestone = (milestoneId: string) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      deleteMilestoneMutation.mutate(milestoneId);
    }
  };

  // Handle milestone status update
  const handleStatusUpdate = (milestoneId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED') => {
    updateStatusMutation.mutate({ milestoneId, newStatus });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    milestoneMutation.mutate({
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      status,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DELAYED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Check if user can edit milestones
  const canEditMilestones = isFounder || isAdmin;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorAlert message="Failed to load milestones" />;
  }

  return (
    <div className="space-y-8">
      {/* Header with button for authorized users */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Milestones {milestones?.length > 0 && `(${milestones.length})`}
        </h2>
        {canEditMilestones && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowMilestoneForm(!showMilestoneForm);
            }}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
          </button>
        )}
      </div>
      
      {/* Milestone form */}
      {showMilestoneForm && (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
            </h3>
            
            {error && <ErrorAlert message={error} />}
            
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Due Date */}
              <div>
                <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="date"
                  id="due-date"
                  name="due-date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              </div>
              
              {/* Submit button */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={milestoneMutation.isLoading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {milestoneMutation.isLoading 
                      ? (editingMilestone ? 'Updating...' : 'Creating...') 
                      : (editingMilestone ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Milestones list */}
      {milestones?.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No milestones yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canEditMilestones 
              ? 'Get started by adding the first milestone for this startup.' 
              : 'This startup has not defined any milestones yet.'}
          </p>
          {canEditMilestones && !showMilestoneForm && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowMilestoneForm(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Add milestone
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {milestones.map((milestone: Milestone) => (
              <li key={milestone.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {milestone.title}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(milestone.status)}`}>
                        {milestone.status.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Due: {formatDate(milestone.dueDate)}
                      </span>
                    </div>
                  </div>
                  {canEditMilestones && (
                    <div className="ml-4 flex-shrink-0 flex">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => handleEditMilestone(milestone)}
                          className="mr-2 rounded-md bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="rounded-md bg-white p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-red-400"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{milestone.description}</p>
                </div>
                
                {canEditMilestones && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Status
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(milestone.id, 'PENDING')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          milestone.status === 'PENDING'
                            ? 'bg-gray-200 border-gray-300 text-gray-800 dark:bg-gray-600 dark:border-gray-500 dark:text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(milestone.id, 'IN_PROGRESS')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          milestone.status === 'IN_PROGRESS'
                            ? 'bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-800 dark:border-blue-700 dark:text-blue-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(milestone.id, 'COMPLETED')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-green-200 border-green-300 text-green-800 dark:bg-green-800 dark:border-green-700 dark:text-green-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(milestone.id, 'DELAYED')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          milestone.status === 'DELAYED'
                            ? 'bg-yellow-200 border-yellow-300 text-yellow-800 dark:bg-yellow-800 dark:border-yellow-700 dark:text-yellow-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Delayed
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
