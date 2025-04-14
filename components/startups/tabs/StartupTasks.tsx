import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedToId: string;
  assignedTo?: {
    id: string;
    name: string;
    image?: string;
  };
  startupId: string;
  createdAt: string;
  updatedAt: string;
};

type StartupTasksProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
  userId?: string;
};

export default function StartupTasks({ startup, isFounder, isAdmin, userId }: StartupTasksProps) {
  const queryClient = useQueryClient();
  
  // State for form and editing
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('TODO');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [error, setError] = useState('');

  // Fetch tasks
  const { data: tasks, isLoading, isError } = useQuery(
    ['tasks', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    {
      initialData: startup.tasks || [],
      enabled: !startup.tasks
    }
  );

  // Fetch team members for assignment
  const { data: teamMembers } = useQuery(
    ['team', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/team`);
      if (!res.ok) throw new Error('Failed to fetch team members');
      return res.json();
    },
    {
      initialData: [],
      enabled: isFounder || isAdmin
    }
  );

  // Create/update task mutation
  const taskMutation = useMutation(
    async (taskData: any) => {
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask 
        ? `/api/startups/${startup.id}/tasks/${editingTask.id}`
        : `/api/startups/${startup.id}/tasks`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save task');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries(['tasks', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Delete task mutation
  const deleteTaskMutation = useMutation(
    async (taskId: string) => {
      const res = await fetch(`/api/startups/${startup.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete task');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Update task status mutation
  const updateStatusMutation = useMutation(
    async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const res = await fetch(`/api/startups/${startup.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update task status');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', startup.id]);
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
    setStatus('TODO');
    setPriority('MEDIUM');
    setAssignedToId('');
    setEditingTask(null);
    setShowTaskForm(false);
    setError('');
  };

  // Handle task edit
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
    setStatus(task.status);
    setPriority(task.priority);
    setAssignedToId(task.assignedToId);
    setShowTaskForm(true);
  };

  // Handle task delete
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Handle status update
  const handleStatusUpdate = (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') => {
    updateStatusMutation.mutate({ taskId, newStatus });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    taskMutation.mutate({
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      status,
      priority,
      assignedToId: assignedToId || userId,
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
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Check if user can manage tasks
  const canManageTasks = isFounder || isAdmin;
  
  // Check if task is assigned to the user
  const isAssignedToUser = (task: Task) => task.assignedToId === userId;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorAlert message="Failed to load tasks" />;
  }

  return (
    <div className="space-y-8">
      {/* Header with button for authorized users */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tasks {tasks?.length > 0 && `(${tasks.length})`}
        </h2>
        {canManageTasks && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowTaskForm(!showTaskForm);
            }}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {showTaskForm ? 'Cancel' : 'Add Task'}
          </button>
        )}
      </div>
      
      {/* Task form */}
      {showTaskForm && (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'Add New Task'}
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
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
                
                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                
                {/* Assigned To */}
                <div>
                  <label htmlFor="assigned-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned To
                  </label>
                  <select
                    id="assigned-to"
                    name="assigned-to"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a team member</option>
                    {teamMembers?.map((member: any) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    disabled={taskMutation.isLoading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {taskMutation.isLoading 
                      ? (editingTask ? 'Updating...' : 'Creating...') 
                      : (editingTask ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Tasks list */}
      {tasks?.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canManageTasks 
              ? 'Get started by adding the first task for this startup.' 
              : 'This startup has not created any tasks yet.'}
          </p>
          {canManageTasks && !showTaskForm && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowTaskForm(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Add task
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task: Task) => (
              <li key={task.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  {(canManageTasks || isAssignedToUser(task)) && (
                    <div className="ml-4 flex-shrink-0 flex">
                      {canManageTasks && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="mr-2 rounded-md bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="rounded-md bg-white p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-red-400"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assigned to: {task.assignedTo?.name || 'Unassigned'}
                  </div>
                </div>
                
                {(canManageTasks || isAssignedToUser(task)) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(task.id, 'TODO')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          task.status === 'TODO'
                            ? 'bg-gray-200 border-gray-300 text-gray-800 dark:bg-gray-600 dark:border-gray-500 dark:text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        To Do
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          task.status === 'IN_PROGRESS'
                            ? 'bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-800 dark:border-blue-700 dark:text-blue-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          task.status === 'COMPLETED'
                            ? 'bg-green-200 border-green-300 text-green-800 dark:bg-green-800 dark:border-green-700 dark:text-green-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(task.id, 'BLOCKED')}
                        className={`px-2 py-1 text-xs rounded-md border ${
                          task.status === 'BLOCKED'
                            ? 'bg-red-200 border-red-300 text-red-800 dark:bg-red-800 dark:border-red-700 dark:text-red-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Blocked
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
