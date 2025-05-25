import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, ExternalLink, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  user: {
    name: string;
    email: string;
    image: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
}

const INDUSTRY_OPTIONS = [
  'Software',
  'Hardware',
  'AI/ML',
  'Blockchain',
  'Healthcare',
  'Education',
  'Finance',
  'E-commerce',
  'Social Impact',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'most_liked', label: 'Most Liked' },
];

export default function StartupIdeas() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIdeas, setLikedIdeas] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchIdeas();
  }, [searchQuery, selectedIndustries, sortBy]);

  const fetchIdeas = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedIndustries.size > 0) {
        selectedIndustries.forEach(industry => params.append('industry', industry));
      }
      params.append('sort', sortBy);

      const response = await axios.get(`/api/startup-ideas?${params.toString()}`);
      setIdeas(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch startup ideas',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(industry)) {
        newSet.delete(industry);
      } else {
        newSet.add(industry);
      }
      return newSet;
    });
  };

  const handleLike = async (ideaId: string) => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to like ideas',
        variant: 'default',
      });
      return;
    }

    try {
      const response = await axios.post(`/api/startup-ideas/${ideaId}/like`);
      const { liked } = response.data;

      setLikedIdeas(prev => {
        const newSet = new Set(prev);
        if (liked) {
          newSet.add(ideaId);
        } else {
          newSet.delete(ideaId);
        }
        return newSet;
      });

      setIdeas(prev =>
        prev.map(idea =>
          idea.id === ideaId
            ? {
                ...idea,
                _count: {
                  ...idea._count,
                  likes: idea._count.likes + (liked ? 1 : -1),
                },
              }
            : idea
        )
      );
    } catch (error) {
      console.error('Error liking idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to like the idea',
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

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Startup Ideas</h1>
              <p className="text-muted-foreground mt-2">
                Discover innovative startup ideas from entrepreneurs
              </p>
            </div>
            {session?.user.role === 'ENTREPRENEUR' && (
              <Button asChild>
                <a href="/entrepreneur-dashboard/ideas/new">Share Your Idea</a>
              </Button>
            )}
          </div>

          {/* Search, Sort and Filters */}
          <div className="mb-8 space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search startup ideas..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Filter by Industry</h3>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <Button
                    key={industry}
                    variant={selectedIndustries.has(industry) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {ideas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No startup ideas found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={idea.user.image} alt={idea.user.name} />
                        <AvatarFallback>
                          {idea.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {idea.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleLike(idea.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedIdeas.has(idea.id) ? 'fill-current text-red-500' : ''
                            }`}
                          />
                          <span>{idea._count.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          asChild
                        >
                          <a href={`/startups/${idea.id}`}>
                            <MessageCircle className="h-4 w-4" />
                            <span>{idea._count.comments}</span>
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          asChild
                        >
                          <a href={`/startups/${idea.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span>View Details</span>
                          </a>
                        </Button>
                      </div>
                      {idea.socialLinks && (
                        <div className="flex items-center space-x-2">
                          {idea.socialLinks.website && (
                            <a
                              href={idea.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Posted by {idea.user.name} · {new Date(idea.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 