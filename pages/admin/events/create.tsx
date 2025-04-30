import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import axios from 'axios';

type EventType = 'WORKSHOP' | 'WEBINAR' | 'DEADLINE' | 'ANNOUNCEMENT' | 'NETWORKING' | 'OTHER';

interface StartupCall {
  id: string;
  title: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventType, setEventType] = useState<EventType>('WORKSHOP');
  const [startupCallId, setStartupCallId] = useState('');

  // Fetch startup calls for the dropdown
  useEffect(() => {
    const fetchStartupCalls = async () => {
      try {
        const response = await axios.get('/api/startup-calls');
        setStartupCalls(response.data);
      } catch (error) {
        console.error('Error fetching startup calls:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch startup calls',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStartupCalls();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!title || !description || !startDate || !endDate || !location || !eventType) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Create event
      const response = await axios.post('/api/events', {
        title,
        description,
        startDate,
        endDate,
        location,
        isVirtual,
        virtualLink: isVirtual ? virtualLink : '',
        imageUrl,
        type: eventType,
        startupCallId: startupCallId === 'none' ? null : startupCallId,
      });

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      // Redirect to events page
      router.push('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
      let errorMessage = 'Failed to create event';
      
      // Extract the error message from the axios error
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
        console.error('API error details:', error.response.data);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Create Event | Admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/admin/events')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Create Event</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Enter the details for the new event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Enter event description"
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input 
                      id="startDate" 
                      type="datetime-local" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input 
                      id="endDate" 
                      type="datetime-local" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isVirtual" 
                    checked={isVirtual} 
                    onCheckedChange={setIsVirtual} 
                  />
                  <Label htmlFor="isVirtual">Virtual Event</Label>
                </div>

                {isVirtual && (
                  <div>
                    <Label htmlFor="virtualLink">Virtual Link</Label>
                    <Input 
                      id="virtualLink" 
                      value={virtualLink} 
                      onChange={(e) => setVirtualLink(e.target.value)} 
                      placeholder="Enter virtual event link (e.g. Zoom, Teams, etc.)"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="imageUrl">Event Image URL</Label>
                  <Input 
                    id="imageUrl" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="Enter image URL for the event"
                  />
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKSHOP">Workshop</SelectItem>
                      <SelectItem value="WEBINAR">Webinar</SelectItem>
                      <SelectItem value="DEADLINE">Deadline</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                      <SelectItem value="NETWORKING">Networking</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startupCallId">Associated Startup Call (Optional)</Label>
                  <Select value={startupCallId} onValueChange={setStartupCallId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a startup call (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {startupCalls.map((call) => (
                        <SelectItem key={call.id} value={call.id}>
                          {call.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/events')}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
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
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}; 