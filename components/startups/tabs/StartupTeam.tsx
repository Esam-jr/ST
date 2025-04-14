import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  startupId: string;
  userId?: string;
  image?: string;
  bio?: string;
  createdAt: string;
};

type StartupTeamProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
};

export default function StartupTeam({ startup, isFounder, isAdmin }: StartupTeamProps) {
  const queryClient = useQueryClient();
  
  // State for form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  // Fetch team members
  const { data: teamMembers, isLoading, isError } = useQuery(
    ['team', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/team`);
      if (!res.ok) throw new Error('Failed to fetch team members');
      return res.json();
    },
    {
      initialData: startup.team || [],
      enabled: !startup.team
    }
  );

  // Add team member mutation
  const addTeamMemberMutation = useMutation(
    async (data: any) => {
      const res = await fetch(`/api/startups/${startup.id}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add team member');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        resetForm();
        queryClient.invalidateQueries(['team', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation(
    async (memberId: string) => {
      const res = await fetch(`/api/startups/${startup.id}/team/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove team member');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('');
    setBio('');
    setShowMemberForm(false);
    setError('');
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    addTeamMemberMutation.mutate({
      name,
      email,
      role,
      bio,
    });
  };

  // Handle team member removal
  const handleRemoveTeamMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      removeTeamMemberMutation.mutate(memberId);
    }
  };

  // Check if user can manage team
  const canManageTeam = isFounder || isAdmin;

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'founder':
      case 'co-founder':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'cto':
      case 'developer':
      case 'engineer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ceo':
      case 'coo':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'marketing':
      case 'cmo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sales':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'finance':
      case 'cfo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'designer':
      case 'ux':
      case 'ui':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorAlert message="Failed to load team members" />;
  }

  return (
    <div className="space-y-8">
      {/* Header with button for authorized users */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Team {teamMembers?.length > 0 && `(${teamMembers.length})`}
        </h2>
        {canManageTeam && (
          <button
            type="button"
            onClick={() => setShowMemberForm(!showMemberForm)}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {showMemberForm ? 'Cancel' : 'Add Team Member'}
          </button>
        )}
      </div>
      
      {/* Team member form */}
      {showMemberForm && (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Add New Team Member
            </h3>
            
            {error && <ErrorAlert message={error} />}
            
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Co-Founder, CTO, Developer, Designer, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
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
                    disabled={addTeamMemberMutation.isLoading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {addTeamMemberMutation.isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Team members grid */}
      {teamMembers?.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No team members yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canManageTeam 
              ? 'Get started by adding team members to this startup.' 
              : 'This startup has not added any team members yet.'}
          </p>
          {canManageTeam && !showMemberForm && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowMemberForm(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Add team member
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* First always show the founder */}
          <div className="col-span-1 flex flex-col rounded-lg bg-white text-center shadow dark:bg-gray-800">
            <div className="flex flex-1 flex-col p-8">
              {startup.founder?.image ? (
                <img
                  className="mx-auto h-24 w-24 flex-shrink-0 rounded-full"
                  src={startup.founder.image}
                  alt={`${startup.founder.name} avatar`}
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-3xl font-bold">
                  {startup.founder?.name?.charAt(0) || '?'}
                </div>
              )}
              <h3 className="mt-6 text-sm font-medium text-gray-900 dark:text-white">{startup.founder?.name}</h3>
              <dl className="mt-1 flex flex-grow flex-col justify-between">
                <dt className="sr-only">Role</dt>
                <dd className="mx-auto mt-3">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    Founder
                  </span>
                </dd>
                <dt className="sr-only">Email</dt>
                <dd className="mt-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{startup.founder?.email}</span>
                </dd>
              </dl>
            </div>
          </div>

          {/* Then show all other team members */}
          {teamMembers.map((member: TeamMember) => (
            <div key={member.id} className="col-span-1 flex flex-col rounded-lg bg-white text-center shadow dark:bg-gray-800">
              <div className="flex flex-1 flex-col p-8">
                {member.image ? (
                  <img
                    className="mx-auto h-24 w-24 flex-shrink-0 rounded-full"
                    src={member.image}
                    alt={`${member.name} avatar`}
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-3xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
                <h3 className="mt-6 text-sm font-medium text-gray-900 dark:text-white">{member.name}</h3>
                <dl className="mt-1 flex flex-grow flex-col justify-between">
                  <dt className="sr-only">Role</dt>
                  <dd className="mx-auto mt-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </dd>
                  <dt className="sr-only">Email</dt>
                  <dd className="mt-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{member.email}</span>
                  </dd>
                  {member.bio && (
                    <dd className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{member.bio}</p>
                    </dd>
                  )}
                </dl>
              </div>
              {canManageTeam && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="-mt-px flex">
                    <div className="flex w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent py-4 text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
