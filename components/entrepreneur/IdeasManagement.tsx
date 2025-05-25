import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, ExternalLink, Edit, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface StartupIdea {
  id: string;
  title: string;
  description: string;
  industry: string[];
  coverImage?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  status: string;
}

export default function IdeasManagement() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyIdeas();
  }, []);

  const fetchMyIdeas = async () => {
    try {
      const response = await axios.get('/api/startup-ideas/me');
      setIdeas(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your ideas',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) {
      return;
    }

    try {
      await axios.delete(`/api/startup-ideas/${ideaId}`);
      toast({
        title: 'Success',
        description: 'Idea deleted successfully',
      });
      setIdeas(ideas.filter(idea => idea.id !== ideaId));
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the idea',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Ideas</h2>
        <Button asChild>
          <Link href="/entrepreneur-dashboard/ideas/new">
            Share New Idea
          </Link>
        </Button>
      </div>

      {ideas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't shared any startup ideas yet
            </p>
            <Button asChild>
              <Link href="/entrepreneur-dashboard/ideas/new">
                Share Your First Idea
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <Card key={idea.id} className="overflow-hidden">
              {idea.coverImage && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={idea.coverImage}
                    alt={idea.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{idea.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {idea.industry.map((ind) => (
                        <Badge key={ind} variant="secondary">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant={idea.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {idea.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3 mb-4">
                  {idea.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{idea._count.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{idea._count.comments}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/startups/${idea.id}`}>
                        <ExternalLink className="h-4 w-4" />
                        <span className="ml-1">View</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/entrepreneur-dashboard/ideas/${idea.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="ml-1">Edit</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(idea.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1">Delete</span>
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Posted on {new Date(idea.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 