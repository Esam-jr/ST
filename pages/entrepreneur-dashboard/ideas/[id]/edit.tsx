import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

export default function EditStartupIdea() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: [] as string[],
    coverImage: '',
    socialLinks: {
      website: '',
      linkedin: '',
      twitter: '',
    },
    status: 'PUBLISHED',
  });

  useEffect(() => {
    if (id && session) {
      fetchIdeaDetails();
    }
  }, [id, session]);

  const fetchIdeaDetails = async () => {
    try {
      const response = await axios.get(`/api/startup-ideas/${id}`);
      const idea = response.data;
      setFormData({
        title: idea.title,
        description: idea.description,
        industry: idea.industry,
        coverImage: idea.coverImage || '',
        socialLinks: idea.socialLinks || {
          website: '',
          linkedin: '',
          twitter: '',
        },
        status: idea.status,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching idea details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load idea details',
        variant: 'destructive',
      });
      router.push('/entrepreneur-dashboard');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== 'ENTREPRENEUR') {
    router.push('/entrepreneur-dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`/api/startup-ideas/${id}`, formData);
      toast({
        title: 'Success',
        description: 'Your idea has been updated successfully',
      });
      router.push('/entrepreneur-dashboard');
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your idea',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIndustryToggle = (industry: string) => {
    setFormData(prev => {
      const industries = prev.industry.includes(industry)
        ? prev.industry.filter(i => i !== industry)
        : [...prev.industry, industry];
      return { ...prev, industry: industries };
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/startup-ideas/${id}`);
      toast({
        title: 'Success',
        description: 'Your idea has been deleted successfully',
      });
      router.push('/entrepreneur-dashboard');
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete your idea',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Edit Startup Idea</CardTitle>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  Delete Idea
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    className="min-h-[150px]"
                  />
                </div>

                <div>
                  <Label>Industry</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <Button
                        key={industry}
                        type="button"
                        variant={
                          formData.industry.includes(industry)
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => handleIndustryToggle(industry)}
                        className="justify-start"
                      >
                        {industry}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) =>
                      setFormData({ ...formData, coverImage: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-4">
                  <Label>Social Links</Label>
                  <div>
                    <Label htmlFor="website" className="text-sm">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            website: e.target.value,
                          },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            linkedin: e.target.value,
                          },
                        })
                      }
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            twitter: e.target.value,
                          },
                        })
                      }
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? <LoadingSpinner /> : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 