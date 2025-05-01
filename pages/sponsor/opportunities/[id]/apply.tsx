import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Building,
  Star,
  Check,
  Info,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Define schema for the application form
const formSchema = z.object({
  amount: z.coerce.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive({
    message: "Amount must be positive",
  }),
  currency: z.string().min(1, { message: "Currency is required" }),
  message: z.string().optional(),
  termsAgreed: z.boolean().refine(value => value === true, {
    message: "You must agree to the terms",
  }),
});

// Define types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  deadline?: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
}

export default function ApplyForOpportunityPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  
  // Initialize form with zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      currency: '',
      message: '',
      termsAgreed: false,
    },
  });
  
  useEffect(() => {
    // Redirect if not authenticated sponsor
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + router.asPath);
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'SPONSOR') {
      router.push('/dashboard');
    } else if (sessionStatus === 'authenticated' && id) {
      fetchOpportunityData();
    }
  }, [sessionStatus, session, router, id]);

  // Set default form values based on opportunity data
  useEffect(() => {
    if (opportunity) {
      form.setValue('currency', opportunity.currency);
      form.setValue('amount', opportunity.minAmount);
    }
  }, [opportunity, form]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch opportunity details
      const opportunityResponse = await axios.get(`/api/sponsorship-opportunities/${id}`);
      const opportunityData = opportunityResponse.data;
      
      // If opportunity is not active, redirect back
      if (opportunityData.status !== 'active') {
        toast({
          title: 'Not Available',
          description: 'This sponsorship opportunity is not currently accepting applications',
          variant: 'destructive',
        });
        router.push('/sponsor/opportunities');
        return;
      }
      
      setOpportunity(opportunityData);
      
      // Check if user already has an application for this opportunity
      try {
        const applicationResponse = await axios.get(`/api/sponsors/me/applications/${id}`);
        if (applicationResponse.data) {
          setHasExistingApplication(true);
          // Redirect to opportunity details page
          router.push(`/sponsor/opportunities/${id}`);
        }
      } catch (error) {
        // No application found - this is expected and means user can apply
        console.log('No existing application found');
      }
    } catch (error) {
      console.error('Error fetching opportunity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load opportunity data',
        variant: 'destructive',
      });
      router.push('/sponsor/opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (!opportunity) return;
      
      // Validate amount is within range
      if (data.amount < opportunity.minAmount || data.amount > opportunity.maxAmount) {
        toast({
          title: 'Invalid Amount',
          description: `Amount must be between ${formatCurrency(opportunity.minAmount, opportunity.currency)} and ${formatCurrency(opportunity.maxAmount, opportunity.currency)}`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Submit application
      const response = await axios.post('/api/sponsorship-applications', {
        opportunityId: opportunity.id,
        amount: data.amount,
        currency: data.currency,
        message: data.message,
      });
      
      toast({
        title: 'Application Submitted',
        description: 'Your sponsorship application has been submitted successfully',
      });
      
      // Redirect to opportunity details page
      router.push(`/sponsor/opportunities/${opportunity.id}`);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if opportunity has a deadline and if it's in the past
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    return deadlineDate < now;
  };

  if (loading) {
    return (
      <Layout title="Apply for Sponsorship Opportunity">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsor/opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (hasExistingApplication) {
    return (
      <Layout title="Already Applied">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href={`/sponsor/opportunities/${id}`} className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Already Applied</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">You have already applied for this sponsorship opportunity.</p>
              <Link href={`/sponsor/opportunities/${id}`}>
                <Button>View Your Application</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!opportunity) {
    return (
      <Layout title="Opportunity Not Found">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsor/opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Opportunity Not Found</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">The sponsorship opportunity you are trying to apply for could not be found.</p>
              <Link href="/sponsor/opportunities">
                <Button>Return to All Opportunities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Check if deadline has passed
  if (opportunity.deadline && isDeadlinePassed(opportunity.deadline)) {
    return (
      <Layout title="Application Deadline Passed">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href={`/sponsor/opportunities/${id}`} className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Application Deadline Passed</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-gray-600 mb-2 text-lg font-medium">The deadline for this opportunity has passed</p>
              <p className="text-gray-500 mb-4">Applications are no longer being accepted for this sponsorship opportunity.</p>
              <Link href="/sponsor/opportunities">
                <Button>Explore Other Opportunities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Apply for ${opportunity.title}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link href={`/sponsor/opportunities/${id}`} className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Apply for Sponsorship</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Sponsorship Application</CardTitle>
                <CardDescription>
                  Complete the form below to express your interest in this sponsorship opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sponsorship Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5">
                                  <DollarSign className="h-4 w-4 text-gray-500" />
                                </span>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  className="pl-9" 
                                  min={opportunity.minAmount}
                                  max={opportunity.maxAmount}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Amount must be between {formatCurrency(opportunity.minAmount, opportunity.currency)} and {formatCurrency(opportunity.maxAmount, opportunity.currency)}
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
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormDescription>
                              Currency is set based on the opportunity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share why you're interested in sponsoring this opportunity, or any questions you have..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include any details about your sponsorship interest or specific requests
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Next Steps After Application</p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>Your application will be reviewed by the administrators</li>
                            <li>You may be contacted for additional information or to discuss details</li>
                            <li>If approved, you'll receive notification with further instructions</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="termsAgreed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 mt-1 accent-primary"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the terms and conditions of sponsorship
                            </FormLabel>
                            <FormDescription>
                              By submitting this application, you agree to the sponsorship terms and acknowledge that your application is subject to review and approval.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="min-w-[150px]"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                            Submitting...
                          </span>
                        ) : 'Submit Application'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{opportunity.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mt-1">
                    {opportunity.description}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">Funding Range</span>
                  </div>
                  <p className="text-sm text-gray-600 pl-6">
                    {formatCurrency(opportunity.minAmount, opportunity.currency)} - 
                    {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">Application Deadline</span>
                  </div>
                  <p className="text-sm text-gray-600 pl-6">
                    {formatDate(opportunity.deadline)}
                  </p>
                </div>
                
                {opportunity.benefits.length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">Sponsor Benefits</span>
                    </div>
                    <ul className="text-sm text-gray-600 list-disc pl-11 space-y-1">
                      {opportunity.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {opportunity.startupCall && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">Associated Startup Call</span>
                    </div>
                    <p className="text-sm text-gray-600 pl-6">
                      {opportunity.startupCall.title}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 