import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, ExternalLink, Globe, Linkedin, Twitter, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

interface StartupIdea {
  id: string;
  title: string;
  description: string;
  industry: string[];
  coverImage?: string;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export default function StartupIdeaDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [idea, setIdea] = useState<StartupIdea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIdeaDetails();
      fetchComments();
    }
  }, [id]);

  const fetchIdeaDetails = async () => {
    try {
      const response = await axios.get(`/api/startup-ideas/${id}`);
      setIdea(response.data);
      setLiked(response.data.isLiked || false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching idea details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load idea details',
        variant: 'destructive',
      });
      router.push('/startups');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/startup-ideas/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    }
  };

  const handleLike = async () => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to like ideas',
        variant: 'default',
      });
      return;
    }

    try {
      const response = await axios.post(`/api/startup-ideas/${id}/like`);
      const { liked: newLikedState } = response.data;
      setLiked(newLikedState);
      setIdea(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          likes: prev._count.likes + (newLikedState ? 1 : -1),
        },
      } : null);
    } catch (error) {
      console.error('Error liking idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to like the idea',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to comment',
        variant: 'default',
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await axios.post(`/api/startup-ideas/${id}/comments`, {
        content: newComment.trim(),
      });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      setIdea(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          comments: prev._count.comments + 1,
        },
      } : null);
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
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Success',
        description: 'Link copied to clipboard',
      });
    } catch (error) {
      console.error('Error sharing idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await axios.delete(`/api/startup-ideas/${id}/comments?commentId=${commentId}`);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setIdea(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          comments: prev._count.comments - 1,
        },
      } : null);
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

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Cover Image */}
          {idea.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
              <img
                src={idea.coverImage}
                alt={idea.title}
                className="w-full h-[300px] object-cover"
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">{idea.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Posted by{' '}
                    <span className="font-medium">{idea.user.name}</span> on{' '}
                    {formatDate(idea.createdAt)}
                  </CardDescription>
                </div>
                {session?.user?.id === idea.user.id && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/entrepreneur-dashboard/ideas/${idea.id}/edit`)
                    }
                  >
                    Edit Idea
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Industry Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {idea.industry.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{idea.description}</p>
              </div>

              <Separator className="my-6" />

              {/* Social Links */}
              {idea.socialLinks && (
                <div className="flex gap-4 mb-6">
                  {idea.socialLinks.website && (
                    <a
                      href={idea.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-muted-foreground hover:text-primary"
                    >
                      <Globe className="h-5 w-5" />
                      <span className="ml-2">Website</span>
                    </a>
                  )}
                  {idea.socialLinks.linkedin && (
                    <a
                      href={idea.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-muted-foreground hover:text-primary"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span className="ml-2">LinkedIn</span>
                    </a>
                  )}
                  {idea.socialLinks.twitter && (
                    <a
                      href={idea.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-muted-foreground hover:text-primary"
                    >
                      <Twitter className="h-5 w-5" />
                      <span className="ml-2">Twitter</span>
                    </a>
                  )}
                </div>
              )}

              {/* Engagement Actions */}
              <div className="flex items-center gap-4 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={liked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="ml-2">{idea._count.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/startups/${idea.id}/comments`}>
                    <MessageCircle className="h-5 w-5" />
                    <span className="ml-2">{idea._count.comments}</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                  <span className="ml-2">Share</span>
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Comments Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Comments</h3>
                
                {session ? (
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session.user.image || ''} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <Button
                          type="submit"
                          className="mt-2"
                          disabled={submittingComment || !newComment.trim()}
                        >
                          {submittingComment ? (
                            <LoadingSpinner className="mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-muted-foreground">
                      Please{' '}
                      <Link href="/auth/signin" className="text-primary hover:underline">
                        sign in
                      </Link>{' '}
                      to post comments
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {displayedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-4 pb-4 border-b border-muted last:border-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user.image} />
                        <AvatarFallback>
                          {comment.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
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
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {comments.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAllComments(!showAllComments)}
                  >
                    {showAllComments ? 'Show Less' : `Show All (${comments.length}) Comments`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
