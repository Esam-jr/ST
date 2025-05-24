import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/layout/Layout';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Define schema for the form with stronger validation
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title must not exceed 100 characters' }),
  slug: z.string()
    .min(3, { message: 'Slug must be at least 3 characters' })
    .max(100, { message: 'Slug must not exceed 100 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must not exceed 2000 characters' }),
  benefits: z.array(
    z.string().min(1, { message: 'Benefit cannot be empty' })
      .max(200, { message: 'Benefit must not exceed 200 characters' })
  ).min(1, { message: 'At least one benefit is required' }),
  minAmount: z.coerce.number().positive({ message: 'Min amount must be positive' }),
  maxAmount: z.coerce.number().positive({ message: 'Max amount must be positive' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  startupCallId: z.string().optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']),
  deadline: z.string().optional().refine(date => {
    if (!date) return true;
    // Check if the date is in the future
    return new Date(date) > new Date();
  }, { message: "Deadline must be in the future" }),
  industryFocus: z.string().optional(),
  tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
  eligibility: z.string().optional(),
  coverImage: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']),
  tiers: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    benefits: z.array(z.string())
  })).optional()
}).refine(data => data.maxAmount >= data.minAmount, {
  message: "Maximum amount must be greater than or equal to minimum amount",
  path: ["maxAmount"]
});

// Define the type from our zod schema
type FormValues = z.infer<typeof formSchema>;

// Type for startup calls that can be associated with the opportunity
interface StartupCall {
  id: string;
  title: string;
}

export default function CreateSponsorshipOpportunity() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  // Initialize form with zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      benefits: [''],
      minAmount: 1000,
      maxAmount: 10000,
      currency: 'USD',
      status: 'draft',
      deadline: '',
      tags: [],
      visibility: 'PUBLIC'
    },
  });

  // Redirect if not authenticated admin
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/sponsorship-opportunities/create');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive',
      });
    } else if (sessionStatus === 'authenticated') {
      fetchStartupCalls();
    }
  }, [sessionStatus, session, router, toast]);

  // Fetch startup calls for the dropdown
  const fetchStartupCalls = async () => {
    try {
      setIsLoadingCalls(true);
      const response = await axios.get('/api/startup-calls?status=PUBLISHED');
      setStartupCalls(response.data);
    } catch (error) {
      console.error('Error fetching startup calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load startup calls',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCalls(false);
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Filter out empty benefits
      const filteredBenefits = data.benefits.filter(benefit => benefit.trim() !== '');
      
      if (filteredBenefits.length === 0) {
        form.setError('benefits', {
          type: 'manual',
          message: 'At least one non-empty benefit is required'
        });
        setIsSubmitting(false);
        return;
      }
      
      const formData = {
        ...data,
        benefits: filteredBenefits
      };
      
      const response = await axios.post('/api/admin/sponsorship-opportunities', formData);
      
      toast({
        title: 'Success',
        description: 'Sponsorship opportunity created successfully',
      });
      
      router.push('/admin/sponsorship-opportunities');
    } catch (error: any) {
      console.error('Error creating sponsorship opportunity:', error);
      
      // Handle API validation errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        apiErrors.forEach((err: any) => {
          if (err.path) {
            form.setError(err.path[0] as any, {
              type: 'server',
              message: err.message
            });
          }
        });
      } else {
        setFormError(
          error.response?.data?.message || 
          'Failed to create sponsorship opportunity. Please try again.'
        );
      }
      
      toast({
        title: 'Error',
        description: 'Failed to create sponsorship opportunity',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding new benefit field
  const addBenefit = () => {
    const currentBenefits = form.getValues('benefits') || [];
    form.setValue('benefits', [...currentBenefits, '']);
  };

  // Handle removing a benefit field
  const removeBenefit = (index: number) => {
    const currentBenefits = form.getValues('benefits') || [];
    // Don't remove if it's the last one
    if (currentBenefits.length <= 1) {
      return;
    }
    const newBenefits = currentBenefits.filter((_, i) => i !== index);
    form.setValue('benefits', newBenefits);
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() !== '') {
      form.setValue('tags', [...form.getValues('tags'), newTag]);
      setNewTag('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    const newTags = currentTags.filter((_, i) => i !== index);
    form.setValue('tags', newTags);
  };

  return (
    <Layout title="Create Sponsorship Opportunity">
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin/sponsorship-opportunities" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Sponsorship Opportunity</h1>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Details</CardTitle>
            <CardDescription>
              Create a new sponsorship opportunity for businesses to sponsor startup initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Technology Innovation Sponsorship" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, concise title for the sponsorship opportunity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. tech-innovation-sponsorship" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be used in the URL. Use only lowercase letters, numbers, and hyphens.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the sponsorship opportunity and its impact..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of what the sponsorship entails and its benefits.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startupCallId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Startup Call (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a startup call" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCalls ? (
                            <div className="text-center py-2">Loading...</div>
                          ) : startupCalls.length === 0 ? (
                            <div className="text-center py-2">No active startup calls</div>
                          ) : (
                            startupCalls.map((call) => (
                              <SelectItem key={call.id} value={call.id}>
                                {call.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Connect this opportunity to a specific startup call (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          The minimum sponsorship amount.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          The maximum sponsorship amount.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                            <SelectItem value="AUD">AUD ($)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="ETB">ETB (ETB)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The currency for the sponsorship amounts.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set to Draft to save without making it public, or Active to publish immediately.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The deadline for sponsors to apply for this opportunity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industryFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Focus</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                      </FormControl>
                      <FormDescription>
                        The primary industry this opportunity targets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eligibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eligibility Criteria</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe who is eligible to apply for this sponsorship..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify any requirements or criteria for potential sponsors
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddTag}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {form.getValues("tags").map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(index)}
                                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Add relevant tags to help categorize this opportunity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="RESTRICTED">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can see this opportunity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL of the cover image for this opportunity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Sponsor Benefits *</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBenefit}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Benefit
                    </Button>
                  </div>
                  {form.watch('benefits').map((_, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-3">
                      <FormField
                        control={form.control}
                        name={`benefits.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder={`Benefit ${index + 1} (e.g. Logo on website)`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('benefits').length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <FormMessage>{form.formState.errors.benefits?.message}</FormMessage>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/sponsorship-opportunities')}
                  >
                    Cancel
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Opportunity'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 