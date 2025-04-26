import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react';

// Mock data for demo purposes
const mockEvents = [
  {
    id: '1',
    title: 'Startup Pitch Competition',
    description: 'Present your startup idea to a panel of judges and investors for a chance to win funding.',
    startDate: '2025-04-25T13:00:00Z',
    endDate: '2025-04-25T17:00:00Z',
    location: 'Innovation Hub, San Francisco',
    virtualLink: 'https://example.com/events/pitch-competition',
    isVirtual: false,
    type: 'NETWORKING'
  },
  {
    id: '2',
    title: 'Investor Networking Mixer',
    description: 'Network with potential investors and other entrepreneurs in a casual setting.',
    startDate: '2025-05-10T18:00:00Z',
    endDate: '2025-05-10T21:00:00Z',
    location: 'Tech Lounge, New York',
    virtualLink: 'https://example.com/events/investor-mixer',
    isVirtual: false,
    type: 'NETWORKING'
  },
  {
    id: '3',
    title: 'Startup Funding Workshop',
    description: 'Learn about different funding options and how to prepare for fundraising.',
    startDate: '2025-05-15T10:00:00Z',
    endDate: '2025-05-15T16:00:00Z',
    location: 'Online Webinar',
    virtualLink: 'https://example.com/events/funding-workshop',
    isVirtual: true,
    type: 'WORKSHOP'
  },
  {
    id: '4',
    title: 'Demo Day',
    description: 'Showcase your startup product to the community and potential customers.',
    startDate: '2025-06-05T09:00:00Z',
    endDate: '2025-06-05T17:00:00Z',
    location: 'Convention Center, Austin',
    virtualLink: 'https://example.com/events/demo-day',
    isVirtual: false,
    type: 'WORKSHOP'
  },
  {
    id: '5',
    title: 'Startup Call Q2 Deadline',
    description: 'Last day to submit your startup idea for the Q2 funding cycle.',
    startDate: '2025-06-30T23:59:59Z',
    endDate: '2025-06-30T23:59:59Z',
    location: 'Online Submission',
    virtualLink: 'https://example.com/submit',
    isVirtual: true,
    type: 'DEADLINE'
  },
];

export default function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch events from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Sort events by date (upcoming first)
      const today = new Date();
      const sortedEvents = [...mockEvents]
        .filter(event => new Date(event.startDate) >= today)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 4); // Show only the next 4 events
      
      setEvents(sortedEvents);
      setIsLoading(false);
    }, 800);
  }, []);

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const isSameDay = start.toDateString() === end.toDateString();
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    
    if (isSameDay) {
      return `${start.toLocaleDateString('en-US', dateOptions)} • ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
    } else {
      return `${start.toLocaleDateString('en-US', dateOptions)} - ${end.toLocaleDateString('en-US', dateOptions)}`;
    }
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const getStatusVariant = (days: string) => {
    if (days === 'Today') return 'destructive';
    if (days === 'Tomorrow') return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="border-b pb-4 border-border">
              <div className="mb-2 h-4 w-1/4 rounded bg-muted"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-muted"></div>
              <div className="flex justify-between">
                <div className="h-3 w-1/5 rounded bg-muted"></div>
                <div className="h-3 w-1/5 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No upcoming events</CardTitle>
          <CardDescription>
            There are no events scheduled at the moment. Check back later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/events">
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="divide-y divide-border">
          {events.map((event) => (
            <Link 
              key={event.id} 
              href={event.virtualLink || "#"} 
              className="block px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-primary">
                  {event.title}
                </h4>
                <Badge variant={getStatusVariant(getDaysUntil(event.startDate)) as any}>
                  {getDaysUntil(event.startDate)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  {formatEventDate(event.startDate, event.endDate)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  {event.location}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
