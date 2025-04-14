import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Chart } from 'react-chartjs-2';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type Sponsorship = {
  id: string;
  amount: number;
  sponsorId: string;
  sponsor: {
    id: string;
    name: string;
    image?: string;
  };
  startupId: string;
  date: string;
  notes?: string;
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  startupId: string;
};

type StartupFinancialsProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
  isSponsor: boolean;
};

export default function StartupFinancials({ 
  startup, 
  isFounder, 
  isAdmin, 
  isSponsor
}: StartupFinancialsProps) {
  const queryClient = useQueryClient();
  
  // Sponsorship form state
  const [showSponsorshipForm, setShowSponsorshipForm] = useState(false);
  const [sponsorAmount, setSponsorAmount] = useState('');
  const [sponsorNotes, setSponsorNotes] = useState('');
  
  // Expense form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  
  const [error, setError] = useState('');

  // Fetch sponsorships
  const { 
    data: sponsorships, 
    isLoading: sponsorshipsLoading, 
    isError: sponsorshipsError 
  } = useQuery(
    ['sponsorships', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/sponsorships`);
      if (!res.ok) throw new Error('Failed to fetch sponsorships');
      return res.json();
    },
    {
      initialData: startup.sponsorships || [],
      enabled: !startup.sponsorships
    }
  );

  // Fetch expenses
  const { 
    data: expenses, 
    isLoading: expensesLoading, 
    isError: expensesError 
  } = useQuery(
    ['expenses', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/expenses`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
    {
      initialData: startup.expenses || [],
      enabled: !startup.expenses
    }
  );

  // Add sponsorship mutation
  const addSponsorshipMutation = useMutation(
    async (data: any) => {
      const res = await fetch(`/api/startups/${startup.id}/sponsorships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add sponsorship');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        setSponsorAmount('');
        setSponsorNotes('');
        setShowSponsorshipForm(false);
        queryClient.invalidateQueries(['sponsorships', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Add expense mutation
  const addExpenseMutation = useMutation(
    async (data: any) => {
      const res = await fetch(`/api/startups/${startup.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add expense');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        setExpenseAmount('');
        setExpenseCategory('');
        setExpenseDescription('');
        setShowExpenseForm(false);
        queryClient.invalidateQueries(['expenses', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Handle sponsorship form submission
  const handleSponsorshipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    addSponsorshipMutation.mutate({
      amount: parseFloat(sponsorAmount),
      notes: sponsorNotes,
      date: new Date().toISOString(),
    });
  };

  // Handle expense form submission
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    addExpenseMutation.mutate({
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      description: expenseDescription,
      date: new Date().toISOString(),
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  // Calculate total sponsorships
  const totalSponsorship = sponsorships?.reduce((sum: number, s: Sponsorship) => sum + s.amount, 0) || 0;
  
  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0;
  
  // Calculate current balance
  const currentBalance = totalSponsorship - totalExpenses;

  // Check if user can manage financials
  const canManageFinancials = isFounder || isAdmin;
  
  // Check if user can sponsor
  const canSponsor = isSponsor;

  // Prepare chart data
  const expensesByCategory = expenses?.reduce((acc: {[key: string]: number}, expense: Expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {}) || {};

  const expenseChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Object.values(expensesByCategory),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (sponsorshipsLoading || expensesLoading) {
    return <LoadingSpinner />;
  }

  if (sponsorshipsError || expensesError) {
    return <ErrorAlert message="Failed to load financial data" />;
  }

  return (
    <div className="space-y-8">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Funding</dt>
                  <dd className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalSponsorship)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-red-100 p-3 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</dt>
                  <dd className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${
                currentBalance >= 0 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-yellow-100 dark:bg-yellow-900'
              }`}>
                <svg className={`h-6 w-6 ${
                  currentBalance >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</dt>
                  <dd className={`text-xl font-semibold ${
                    currentBalance >= 0 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(currentBalance)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Sponsorships Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Sponsorships {sponsorships?.length > 0 && `(${sponsorships.length})`}
            </h2>
            {canSponsor && (
              <button
                type="button"
                onClick={() => setShowSponsorshipForm(!showSponsorshipForm)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {showSponsorshipForm ? 'Cancel' : 'Add Sponsorship'}
              </button>
            )}
          </div>

          {/* Sponsorship form */}
          {showSponsorshipForm && (
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Add New Sponsorship
                </h3>
                
                {error && <ErrorAlert message={error} />}
                
                <form onSubmit={handleSponsorshipSubmit} className="mt-5 space-y-4">
                  {/* Amount */}
                  <div>
                    <label htmlFor="sponsor-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sponsorship Amount ($)
                    </label>
                    <input
                      type="number"
                      id="sponsor-amount"
                      name="sponsor-amount"
                      min="1"
                      step="0.01"
                      value={sponsorAmount}
                      onChange={(e) => setSponsorAmount(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label htmlFor="sponsor-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="sponsor-notes"
                      name="sponsor-notes"
                      rows={3}
                      value={sponsorNotes}
                      onChange={(e) => setSponsorNotes(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Submit button */}
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowSponsorshipForm(false)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addSponsorshipMutation.isLoading}
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {addSponsorshipMutation.isLoading ? 'Adding...' : 'Add Sponsorship'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Sponsorships list */}
          {sponsorships?.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sponsorships yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {canSponsor 
                  ? 'Be the first to sponsor this startup!' 
                  : 'This startup has not received any sponsorships yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {sponsorships.map((sponsorship: Sponsorship) => (
                  <li key={sponsorship.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {sponsorship.sponsor?.image ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={sponsorship.sponsor.image}
                            alt={`${sponsorship.sponsor.name} avatar`}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                            {sponsorship.sponsor?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {sponsorship.sponsor?.name || 'Anonymous Sponsor'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(sponsorship.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(sponsorship.amount)}
                        </p>
                      </div>
                    </div>
                    {sponsorship.notes && (
                      <div className="mt-2 ml-13 text-sm text-gray-600 dark:text-gray-300">
                        {sponsorship.notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Expenses {expenses?.length > 0 && `(${expenses.length})`}
            </h2>
            {canManageFinancials && (
              <button
                type="button"
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {showExpenseForm ? 'Cancel' : 'Add Expense'}
              </button>
            )}
          </div>

          {/* Expense form */}
          {showExpenseForm && (
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Add New Expense
                </h3>
                
                {error && <ErrorAlert message={error} />}
                
                <form onSubmit={handleExpenseSubmit} className="mt-5 space-y-4">
                  {/* Amount */}
                  <div>
                    <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expense Amount ($)
                    </label>
                    <input
                      type="number"
                      id="expense-amount"
                      name="expense-amount"
                      min="0.01"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      id="expense-category"
                      name="expense-category"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Development">Development</option>
                      <option value="Operations">Operations</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Legal">Legal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label htmlFor="expense-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="expense-description"
                      name="expense-description"
                      rows={3}
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  {/* Submit button */}
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowExpenseForm(false)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addExpenseMutation.isLoading}
                        className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {addExpenseMutation.isLoading ? 'Adding...' : 'Add Expense'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expenses Chart */}
          {expenses?.length > 0 ? (
            <div className="overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
              <div className="h-64">
                <Chart type="doughnut" data={expenseChartData} />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No expenses yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {canManageFinancials 
                  ? 'Add expenses to track your startup spending.' 
                  : 'No expenses have been recorded yet.'}
              </p>
            </div>
          )}

          {/* Expenses list - only show if we have expenses and after the chart */}
          {expenses?.length > 0 && (
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense: Expense) => (
                  <li key={expense.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.description}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {expense.category}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          -{formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
