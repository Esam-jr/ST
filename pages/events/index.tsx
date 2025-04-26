import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import { format, isSameDay, parseISO, isAfter, isBefore, addMonths, addDays } from 'date-fns';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Globe } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import EventCard from '@/components/ui/EventCard';

// Event type definition (matching the schema)
type Event = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  imageUrl?: string;
  type: string;
  startupCallId?: string;
  createdAt: string;
  updatedAt: string;
  startupCall?: {
    id: string;
    title: string;
  };
};

export default function EventsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const now = new Date();
  const oneMonthFromNow = addDays(now, 30);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Build query parameters based on active tab
        const params = new URLSearchParams();
        
        if (activeTab === 'upcoming') {
          params.append('from', now.toISOString());
        } else if (activeTab === 'month') {
          params.append('from', now.toISOString());
          params.append('to', oneMonthFromNow.toISOString());
        }
        
        const response = await axios.get(`/api/events?${params.toString()}`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load events',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [toast, activeTab, now, oneMonthFromNow]);
  
  // Group events by date for the calendar view
  const eventsByDate: Record<string, Event[]> = {};
  
  events.forEach(event => {
    const date = format(new Date(event.startDate), 'yyyy-MM-dd');
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    eventsByDate[date].push(event);
  });
  
  if (loading) {
    return (
      <Layout title="Events">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title="Events Calendar"
      description="Upcoming workshops, webinars, deadlines, and networking events"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Events Calendar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Stay updated with upcoming workshops, webinars, deadlines, and networking opportunities
          </p>
        </div>
        
        <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
            <TabsTrigger value="month">Next 30 Days</TabsTrigger>
              </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
                  </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-semibold">No events scheduled</h3>
            <p className="mt-2 text-lg text-muted-foreground">
              Check back later for new events and activities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 