import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type Review = {
  id: string;
  score: number;
  innovationScore: number;
  marketScore: number;
  teamScore: number;
  executionScore: number;
  feedback: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    image?: string;
  };
};

type StartupReviewsProps = {
  startup: any;
  isReviewer: boolean;
  isAdmin: boolean;
  userId?: string;
};

export default function StartupReviews({ startup, isReviewer, isAdmin, userId }: StartupReviewsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  // State for form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [innovationScore, setInnovationScore] = useState(5);
  const [marketScore, setMarketScore] = useState(5);
  const [teamScore, setTeamScore] = useState(5);
  const [executionScore, setExecutionScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Fetch reviews
  const { data: reviews, isLoading, isError } = useQuery(
    ['reviews', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    {
      initialData: startup.reviews || [],
      // Only refetch if we don't already have the data from the parent
      enabled: !startup.reviews
    }
  );

  // Check if user has already submitted a review
  const hasReviewed = reviews?.some((review: Review) => review.reviewer.id === userId);

  // Submit review mutation
  const submitReviewMutation = useMutation(
    async (reviewData: any) => {
      const res = await fetch(`/api/startups/${startup.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit review');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        // Reset form
        setInnovationScore(5);
        setMarketScore(5);
        setTeamScore(5);
        setExecutionScore(5);
        setFeedback('');
        setShowReviewForm(false);
        
        // Refetch reviews
        queryClient.invalidateQueries(['reviews', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Handle review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Calculate overall score (average of all scores)
    const averageScore = Math.round(((innovationScore + marketScore + teamScore + executionScore) / 4) * 10) / 10;
    
    submitReviewMutation.mutate({
      score: averageScore,
      innovationScore,
      marketScore,
      teamScore,
      executionScore,
      feedback,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorAlert message="Failed to load reviews" />;
  }

  return (
    <div className="space-y-8">
      {/* Header with button for reviewers */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {isReviewer && !hasReviewed && startup.status === 'UNDER_REVIEW' && (
          <button
            type="button"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {showReviewForm ? 'Cancel' : 'Add Review'}
          </button>
        )}
      </div>
      
      {/* Review form */}
      {showReviewForm && (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Submit your review</h3>
            
            {error && <ErrorAlert message={error} />}
            
            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                {/* Innovation Score */}
                <div>
                  <label htmlFor="innovation-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Innovation Score: {innovationScore}
                  </label>
                  <input
                    type="range"
                    id="innovation-score"
                    name="innovation-score"
                    min="1"
                    max="10"
                    step="0.5"
                    value={innovationScore}
                    onChange={(e) => setInnovationScore(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <p className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </p>
                </div>
                
                {/* Market Score */}
                <div>
                  <label htmlFor="market-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Market Potential Score: {marketScore}
                  </label>
                  <input
                    type="range"
                    id="market-score"
                    name="market-score"
                    min="1"
                    max="10"
                    step="0.5"
                    value={marketScore}
                    onChange={(e) => setMarketScore(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <p className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </p>
                </div>
                
                {/* Team Score */}
                <div>
                  <label htmlFor="team-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Team Score: {teamScore}
                  </label>
                  <input
                    type="range"
                    id="team-score"
                    name="team-score"
                    min="1"
                    max="10"
                    step="0.5"
                    value={teamScore}
                    onChange={(e) => setTeamScore(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <p className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </p>
                </div>
                
                {/* Execution Score */}
                <div>
                  <label htmlFor="execution-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Execution Score: {executionScore}
                  </label>
                  <input
                    type="range"
                    id="execution-score"
                    name="execution-score"
                    min="1"
                    max="10"
                    step="0.5"
                    value={executionScore}
                    onChange={(e) => setExecutionScore(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <p className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </p>
                </div>
              </div>
              
              {/* Feedback */}
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Detailed Feedback
                </label>
                <div className="mt-1">
                  <textarea
                    id="feedback"
                    name="feedback"
                    rows={5}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please provide detailed feedback on the startup idea, including strengths, weaknesses, and suggestions for improvement."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              {/* Overall score calculation */}
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Overall Score: {Math.round(((innovationScore + marketScore + teamScore + executionScore) / 4) * 10) / 10}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        This is the average of all four scores and will be the main rating displayed for this startup.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit button */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitReviewMutation.isLoading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reviews yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {startup.status === 'DRAFT' 
              ? 'This startup is still in draft mode and not yet available for review.'
              : isReviewer 
                ? 'Be the first to review this startup!' 
                : 'Waiting for reviewers to evaluate this startup.'}
          </p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {reviews.map((review: Review, reviewIdx: number) => (
              <li key={review.id}>
                <div className="relative pb-8">
                  {reviewIdx !== reviews.length - 1 ? (
                    <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      {review.reviewer?.image ? (
                        <img
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400"
                          src={review.reviewer.image}
                          alt={`${review.reviewer.name}'s avatar`}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {review.reviewer?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Review content */}
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">{review.reviewer?.name}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          Reviewed on {formatDate(review.createdAt)}
                        </p>
                      </div>
                      
                      {/* Score badges */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Overall: {review.score}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          Innovation: {review.innovationScore}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          Market: {review.marketScore}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          Team: {review.teamScore}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          Execution: {review.executionScore}
                        </span>
                      </div>
                      
                      {/* Feedback */}
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <p className="whitespace-pre-line">{review.feedback}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
