import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import { format, isSameDay, parseISO, isAfter, isBefore, addMonths } from 'date-fns';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Globe, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';

// Event type definition (matching the schema)
type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  type: string;
  startupCallId?: string;
  createdAt: string;
  updatedAt: string;
};

// Event card component
const EventCard = ({ event }: { event: Event }) => {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  
  // Format date display
  const formatEventDate = () => {
    if (isSameDay(startDate, endDate)) {
      return (
        <>
          <span className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
          <span className="text-muted-foreground ml-2">
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </span>
        </>
      );
    } else {
      return (
        <>
          <span className="font-medium">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </span>
          <span className="text-muted-foreground ml-2">
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </span>
        </>
      );
    }
  };
  
  // Set badge color based on event type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'WORKSHOP':
        return 'default';
      case 'WEBINAR':
        return 'secondary';
      case 'DEADLINE':
        return 'destructive';
      case 'ANNOUNCEMENT':
        return 'outline';
      case 'NETWORKING':
        return 'success';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <Badge variant={getBadgeVariant(event.type) as any}>
            {event.type.charAt(0) + event.type.slice(1).toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-center text-sm">
          <CalendarIcon className="mr-1 h-4 w-4" />
          {formatEventDate()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          {event.location ? (
            <div className="flex items-center text-sm mb-2">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          ) : event.isVirtual ? (
            <div className="flex items-center text-sm mb-2">
              <Globe className="mr-1 h-4 w-4 flex-shrink-0" />
              {event.virtualLink ? (
                <a 
                  href={event.virtualLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  Virtual Event (Join Online)
                </a>
              ) : (
                <span>Virtual Event</span>
              )}
            </div>
          ) : null}
        </div>
        <p className="text-sm">{event.description}</p>
      </CardContent>
    </Card>
  );
};

export default function EventsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState('upcoming');
  
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await axios.get('/api/events');
        setEvents(response.data);
        
        // Initially filter for upcoming events
        filterEvents('upcoming', response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load events',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEvents();
  }, [toast]);
  
  // Filter events based on selected tab
  const filterEvents = (filter: string, eventList = events) => {
    const now = new Date();
    let filtered: Event[];
    
    switch(filter) {
      case 'today':
        filtered = eventList.filter(event => 
          isSameDay(parseISO(event.startDate), now)
        );
        break;
      case 'past':
        filtered = eventList.filter(event => 
          isBefore(parseISO(event.endDate), now)
        ).sort((a, b) => 
          parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
        );
        break;
      case 'month':
        const nextMonth = addMonths(now, 1);
        filtered = eventList.filter(event => 
          isAfter(parseISO(event.startDate), now) && 
          isBefore(parseISO(event.startDate), nextMonth)
        ).sort((a, b) => 
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
        );
        break;
      case 'upcoming':
      default:
        filtered = eventList.filter(event => 
          isAfter(parseISO(event.endDate), now)
        ).sort((a, b) => 
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
        );
        break;
    }
    
    setFilteredEvents(filtered);
    setActiveFilter(filter);
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    const eventsOnDate = events.filter(event => 
      isSameDay(parseISO(event.startDate), date) || 
      (isAfter(parseISO(event.endDate), date) && isBefore(parseISO(event.startDate), date))
    );
    
    setFilteredEvents(eventsOnDate);
    setActiveFilter('date');
  };
  
  if (isLoading) {
    return (
      <Layout title="Events">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Events">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-1">
              Check out upcoming workshops, webinars, and important deadlines
            </p>
          </div>
          
          {session?.user.role === 'ADMIN' && (
            <Button className="mt-4 md:mt-0" asChild>
              <Link href="/admin/events">Manage Events</Link>
            </Button>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="upcoming" value={activeFilter} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger 
                  value="upcoming" 
                  onClick={() => filterEvents('upcoming')}
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="today" 
                  onClick={() => filterEvents('today')}
                >
                  Today
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  onClick={() => filterEvents('month')}
                >
                  This Month
                </TabsTrigger>
                <TabsTrigger 
                  value="past" 
                  onClick={() => filterEvents('past')}
                >
                  Past
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming events scheduled</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="today" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events scheduled for today</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="month" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events scheduled for this month</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No past events</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="date" className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-medium">
                    Events on {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                </div>
                
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events scheduled for this date</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                />
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Event Types</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="default" className="mr-2">Workshop</Badge>
                      <span className="text-sm">In-person training sessions</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">Webinar</Badge>
                      <span className="text-sm">Online presentations</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">Deadline</Badge>
                      <span className="text-sm">Important submission dates</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">Announcement</Badge>
                      <span className="text-sm">Program updates</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="success" className="mr-2">Networking</Badge>
                      <span className="text-sm">Connect with others</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 