import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface StartupIdea {
  id: string;
  title: string;
  user: {
    id: string;
  };
}

export default function IdeaComments() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [idea, setIdea] = useState<StartupIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [ideaResponse, commentsResponse] = await Promise.all([
        axios.get(`/api/startup-ideas/${id}`),
        axios.get(`/api/startup-ideas/${id}/comments`),
      ]);

      setIdea(ideaResponse.data);
      setComments(commentsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/startup-ideas/${id}/comments`, {
        content: newComment.trim(),
      });

      setComments((prev) => [response.data, ...prev]);
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await axios.delete(`/api/startup-ideas/${id}/comments?commentId=${commentId}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!idea) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Idea Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The startup idea you're looking for doesn't exist or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/startups')}
            >
              View All Ideas
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push(`/startups/${id}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Idea
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comments on {idea.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {session ? (
                <form onSubmit={handleSubmit} className="mb-8">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] mb-4"
                  />
                  <Button type="submit" disabled={submitting || !newComment.trim()}>
                    {submitting ? <LoadingSpinner /> : 'Post Comment'}
                  </Button>
                </form>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
                  <p className="text-muted-foreground">
                    Please sign in to post comments
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-4 pb-6 border-b border-muted last:border-0 last:pb-0"
                    >
                      <Avatar>
                        <AvatarImage src={comment.user.image} />
                        <AvatarFallback>
                          {comment.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{comment.user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </div>
                          </div>
                          {(session?.user?.id === comment.user.id ||
                            session?.user?.id === idea.user.id ||
                            session?.user?.role === 'ADMIN') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 