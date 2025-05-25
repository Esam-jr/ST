import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, ExternalLink, Globe, Linkedin, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image: string;
  };
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
      await axios.post(`/api/startup-ideas/${id}/like`);
      fetchIdeaDetails();
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
      await axios.post(`/api/startup-ideas/${id}/comments`, {
        content: newComment,
      });
      setNewComment('');
      fetchComments();
      fetchIdeaDetails();
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
    });
  };

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
                  className={idea.isLiked ? 'text-red-500' : ''}
                >
                  <Heart className="h-5 w-5" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
