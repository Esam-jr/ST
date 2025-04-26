import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
};

export default function EventsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Add pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Create memoized date values to prevent unnecessary re-renders
  const now = new Date();
  const oneMonthFromNow = addDays(now, 30);

  // Build query parameters function
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (activeTab === 'upcoming') {
      params.append('from', now.toISOString());
    } else if (activeTab === 'month') {
      params.append('from', now.toISOString());
      params.append('to', oneMonthFromNow.toISOString());
    }
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    // Add cache buster to prevent caching issues
    params.append('_t', Date.now().toString());
    
    return params;
  }, [activeTab, now, oneMonthFromNow, page, pageSize]);

  // Memoized fetch function to prevent recreation on each render
  const fetchEvents = useCallback(async (tab: string) => {
    let isMounted = true;
    const controller = new AbortController();
    
    try {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      
      // Build query parameters based on active tab
      const params = buildParams();
      
      console.log('Fetching events with params:', params.toString());
      
      // Increase timeout to prevent quick timeouts
      const response = await axios.get(`/api/events?${params.toString()}`, {
        signal: controller.signal,
        timeout: 20000 // 20 second timeout (increased from 8s)
      });
      
      if (!isMounted) return;
      
      if (response.status !== 200) {
        throw new Error(`Server responded with status code ${response.status}`);
      }
      
      console.log('Events response:', response.data);
      
      // Check for the new response structure with pagination info
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const { data: eventsData, total } = response.data;
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setTotalEvents(total || eventsData.length);
      } else {
        // Fallback for old API response format
        const eventsData = Array.isArray(response.data) ? response.data : [];
        setEvents(eventsData);
        setTotalEvents(eventsData.length);
      }
    } catch (error: any) {
      if (!isMounted) return;
      
      console.error('Error fetching events:', error);
      
      if (axios.isCancel(error)) {
        console.log('Request was cancelled');
        return;
      }
      
      // Improved error handling with specific messages for timeouts
      let errorMessage;
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The server took too long to respond.';
      } else {
        errorMessage = 
          error.response?.data?.message || 
          error.message || 
          'Failed to load events';
      }
        
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [buildParams, toast]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1); // Reset to first page on tab change
    setLoading(true);
    fetchEvents(value);
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (page < Math.ceil(totalEvents / pageSize)) {
      setPage(page + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    const cleanup = fetchEvents(activeTab);
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [fetchEvents, activeTab, page]); // Added page dependency
  
  // Group events by date for the calendar view
  const eventsByDate: Record<string, Event[]> = {};
  
  events.forEach(event => {
    const date = format(new Date(event.startDate), 'yyyy-MM-dd');
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    eventsByDate[date].push(event);
  });
  
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
        
        <Tabs defaultValue="upcoming" onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
            <TabsTrigger value="month">Next 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size={40} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-destructive">Error Loading Events</h3>
            <p className="mt-2 text-lg text-muted-foreground">
              {error}. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchEvents(activeTab)}
            >
              Retry
            </Button>
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
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            
            {/* Pagination controls */}
            {totalEvents > pageSize && (
              <div className="flex justify-center items-center mt-8 gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalEvents / pageSize)}
                </span>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={page >= Math.ceil(totalEvents / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 