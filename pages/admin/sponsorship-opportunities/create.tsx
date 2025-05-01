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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import axios from 'axios';

// Define schema for the form
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  benefits: z.array(z.string()),
  minAmount: z.coerce.number().positive({ message: 'Min amount must be positive' }),
  maxAmount: z.coerce.number().positive({ message: 'Max amount must be positive' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  startupCallId: z.string().optional(),
  status: z.string().default('draft'),
  deadline: z.string().optional()
}).refine(data => data.maxAmount >= data.minAmount, {
  message: "Maximum amount must be greater than or equal to minimum amount",
  path: ["maxAmount"]
});

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

  // Initialize form with zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      benefits: [''],
      minAmount: 1000,
      maxAmount: 10000,
      currency: 'USD',
      status: 'draft',
      deadline: ''
    },
  });

  // Redirect if not authenticated admin
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/sponsorship-opportunities/create');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (sessionStatus === 'authenticated') {
      fetchStartupCalls();
    }
  }, [sessionStatus, session, router]);

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
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Filter out empty benefits
      const filteredBenefits = data.benefits.filter(benefit => benefit.trim() !== '');
      
      const response = await axios.post('/api/sponsorship-opportunities', {
        ...data,
        benefits: filteredBenefits
      });
      
      toast({
        title: 'Success',
        description: 'Sponsorship opportunity created successfully',
      });
      
      router.push('/admin/sponsorship-opportunities');
    } catch (error) {
      console.error('Error creating sponsorship opportunity:', error);
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
    const newBenefits = currentBenefits.filter((_, i) => i !== index);
    form.setValue('benefits', newBenefits.length ? newBenefits : ['']);
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
                      <FormLabel>Title</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
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
                        <FormLabel>Minimum Amount</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Sponsor Benefits</h3>
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
                      {index > 0 && (
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