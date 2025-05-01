import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().min(3, { message: 'Location is required' }),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url({ message: 'Virtual link must be a valid URL' }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: 'Image URL must be a valid URL' }).optional().or(z.literal('')),
  type: z.enum(['WORKSHOP', 'NETWORKING', 'CONFERENCE', 'MEETUP', 'DEADLINE', 'OTHER']),
  startupCallId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function EditEventPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  
  // Use SWR for data fetching instead of useEffect
  const { data: event, error: eventError } = useSWR(
    id ? `/api/events/${id}` : null, 
    fetcher
  );
  
  const { data: startupCalls = [], error: callsError } = useSWR(
    '/api/startupcalls',
    fetcher
  );
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      isVirtual: false,
      virtualLink: '',
      imageUrl: '',
      type: 'WORKSHOP',
      startupCallId: 'none',
    },
  });

  // Update form when event data is loaded
  useEffect(() => {
    if (event) {
      // Format dates for input fields
      const formattedStartDate = new Date(event.startDate).toISOString().split('T')[0];
      const formattedEndDate = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '';
      
      // Set form values
      form.reset({
        title: event.title,
        description: event.description,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        location: event.location || '',
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        imageUrl: event.imageUrl || '',
        type: event.type || 'WORKSHOP',
        startupCallId: event.startupCallId || 'none',
      });
    }
  }, [event, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Convert "none" value to null for startupCallId
      const dataToSubmit = {
        ...values,
        startupCallId: values.startupCallId === 'none' ? null : values.startupCallId
      };
      
      await axios.put(`/api/events/${id}`, dataToSubmit);
      
      // Revalidate data globally
      mutate(`/api/events/${id}`);
      mutate('/api/events');
      
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      
      router.push('/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while data is being fetched
  if (!event && !eventError) {
    return (
      <Layout title="Edit Event | Admin">
        <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
          <div>Loading event data...</div>
        </div>
      </Layout>
    );
  }
  
  // Show error state
  if (eventError) {
    return (
      <Layout title="Edit Event | Admin">
        <div className="container mx-auto py-6">
          <div className="text-red-500">
            Error loading event data. Please try again.
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Event | Admin">
      <div className="container mx-auto py-6 space-y-6">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b">
          <Link href="/admin/events" className="mr-4 px-4 py-2 text-primary font-medium border-b-2 border-primary">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </div>
          </Link>
          <Link href="/admin/advertisements" className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Advertisements
            </div>
          </Link>
        </div>

        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Event</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update Event Details</CardTitle>
            <CardDescription>
              Make changes to your event information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WORKSHOP">Workshop</SelectItem>
                            <SelectItem value="NETWORKING">Networking</SelectItem>
                            <SelectItem value="CONFERENCE">Conference</SelectItem>
                            <SelectItem value="MEETUP">Meetup</SelectItem>
                            <SelectItem value="DEADLINE">Deadline</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional if event is a single day
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col space-y-4">
                    <FormField
                      control={form.control}
                      name="isVirtual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Virtual Event</FormLabel>
                            <FormDescription>
                              Check if this is a virtual event
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('isVirtual') && (
                      <FormField
                        control={form.control}
                        name="virtualLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Virtual Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://zoom.us/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description*</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter event description"
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional - URL to an image for the event
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
                        <FormLabel>Related Startup Call</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a startup call (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {startupCalls.map((call: any) => (
                              <SelectItem key={call.id} value={call.id}>
                                {call.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional - Associate this event with a startup call
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Event'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/events',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
}; 