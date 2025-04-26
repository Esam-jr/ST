import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import EventCard from '@/components/ui/EventCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

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

interface UpcomingEventsProps {
  limit?: number;
  showFeatured?: boolean;
  className?: string;
}

export default function UpcomingEvents({
  limit = 4,
  showFeatured = true,
  className = '',
}: UpcomingEventsProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Get current date for filtering
        const now = new Date();
        const fromDate = now.toISOString();
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('from', fromDate);
        params.append('limit', limit.toString());
        
        const response = await axios.get(`/api/events?${params.toString()}`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming events',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [toast, limit]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No upcoming events</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back later for new events and activities.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {showFeatured && events.length > 0 && (
        <div className="mb-8">
          <EventCard 
            event={events[0]} 
            variant="featured"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.slice(showFeatured ? 1 : 0, limit).map((event) => (
          <EventCard 
            key={event.id} 
            event={event}
            variant="compact"
          />
        ))}
      </div>
      
      {events.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <a href="/events">View All Events</a>
          </Button>
        </div>
      )}
    </div>
  );
} 