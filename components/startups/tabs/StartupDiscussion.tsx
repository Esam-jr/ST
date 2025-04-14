import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ErrorAlert from '../../ui/ErrorAlert';

type Comment = {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  startupId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
};

type StartupDiscussionProps = {
  startup: any;
  userId?: string;
};

export default function StartupDiscussion({ startup, userId }: StartupDiscussionProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  const [comment, setComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState('');

  // Fetch comments
  const { data: comments, isLoading, isError } = useQuery(
    ['comments', startup.id],
    async () => {
      const res = await fetch(`/api/startups/${startup.id}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    {
      initialData: startup.comments || [],
      enabled: !startup.comments
    }
  );

  // Add comment mutation
  const addCommentMutation = useMutation(
    async (data: any) => {
      const res = await fetch(`/api/startups/${startup.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add comment');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        setComment('');
        queryClient.invalidateQueries(['comments', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Add reply mutation
  const addReplyMutation = useMutation(
    async (data: any) => {
      const res = await fetch(`/api/startups/${startup.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add reply');
      }
      
      return res.json();
    },
    {
      onSuccess: () => {
        setReplyContent('');
        setReplyToId(null);
        queryClient.invalidateQueries(['comments', startup.id]);
      },
      onError: (err: any) => {
        setError(err.message);
      },
    }
  );

  // Handle comment submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    addCommentMutation.mutate({
      content: comment,
    });
  };

  // Handle reply submission
  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    setError('');
    
    if (!replyContent.trim()) {
      setError('Reply cannot be empty');
      return;
    }
    
    addReplyMutation.mutate({
      content: replyContent,
      parentId,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // If today, show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorAlert message="Failed to load discussion" />;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Discussion
      </h2>
      
      {/* New comment form */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Add a comment
          </h3>
          
          {error && <ErrorAlert message={error} />}
          
          <form onSubmit={handleSubmitComment} className="mt-5 space-y-4">
            <div>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addCommentMutation.isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {addCommentMutation.isLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Comments list */}
      {comments?.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No comments yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Be the first to start a discussion about this startup.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Root level comments */}
          {comments
            .filter((c: Comment) => !c.parentId)
            .sort((a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((comment: Comment) => (
              <div key={comment.id} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div className="px-4 py-5 sm:p-6">
                  {/* Comment header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {comment.author?.image ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={comment.author.image}
                          alt={`${comment.author.name} avatar`}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {comment.author?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.author?.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comment content */}
                  <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-line">{comment.content}</p>
                  </div>

                  {/* Reply button */}
                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {replyToId === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                  </div>

                  {/* Reply form */}
                  {replyToId === comment.id && (
                    <div className="mt-4">
                      <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="space-y-4">
                        <div>
                          <textarea
                            rows={2}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={addReplyMutation.isLoading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            {addReplyMutation.isLoading ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {comments
                    .filter((c: Comment) => c.parentId === comment.id)
                    .sort((a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((reply: Comment) => (
                      <div key={reply.id} className="mt-4 ml-6 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {reply.author?.image ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={reply.author.image}
                                alt={`${reply.author.name} avatar`}
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                                {reply.author?.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {reply.author?.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p className="whitespace-pre-line">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
