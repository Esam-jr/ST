import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Calendar, Edit, MoreVertical, Plus, Search, Share2, Trash2, FileText, Megaphone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import EventAnnouncement from '@/components/admin/EventAnnouncement';
import axios from 'axios';
import React from 'react';

type EventType = 'WORKSHOP' | 'NETWORKING' | 'CONFERENCE' | 'MEETUP' | 'DEADLINE' | 'OTHER';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  imageUrl?: string;
  type: EventType;
  startupCallId?: string;
  StartupCall?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('upcoming');
  const [activeSection, setActiveSection] = useState<string>(router.query.section as string || 'manage');

  // Fetch events with optimized loading
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Use AbortController to handle request cancellation if component unmounts
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await axios.get('/api/events', { signal });
      setEvents(response.data);
      
      return () => controller.abort(); // Cleanup function to abort request if needed
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch events',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cleanup = fetchEvents();
    return () => {
      // Call the cleanup function if it exists
      if (cleanup instanceof Function) {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    if (router.query.section) {
      setActiveSection(router.query.section as string);
    }
  }, [router.query.section]);

  // Memoize filtered events to prevent unnecessary calculations
  const filteredEvents = React.useMemo(() => {
    return events
      .filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const now = new Date();
        const eventDate = new Date(event.startDate);
        
        if (selectedTab === 'upcoming') {
          return matchesSearch && eventDate >= now;
        } else if (selectedTab === 'past') {
          return matchesSearch && eventDate < now;
        }
        
        return matchesSearch;
      })
      .sort((a, b) => {
        // Sort by date (upcoming first or past first based on tab)
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        
        if (selectedTab === 'upcoming') {
          return dateA.getTime() - dateB.getTime(); // Closest dates first
        } else {
          return dateB.getTime() - dateA.getTime(); // Most recent past events first
        }
      });
  }, [events, searchQuery, selectedTab]);

  // Format date for display
  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle event type badge styling
  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'WORKSHOP':
        return 'bg-blue-100 text-blue-800';
      case 'NETWORKING':
        return 'bg-green-100 text-green-800';
      case 'CONFERENCE':
        return 'bg-purple-100 text-purple-800';
      case 'MEETUP':
        return 'bg-yellow-100 text-yellow-800';
      case 'DEADLINE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    router.push(`/admin/events/edit/${event.id}`);
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await axios.delete(`/api/events/${eventToDelete}`);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setEventToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle event selection for viewing details
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
  };

  const renderEventList = () => {
    return (
      <>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Event Management</h1>
          <Button onClick={() => router.push('/admin/events/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Events</CardTitle>
              <div className="w-full max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <CardDescription>
              Manage all your events. Create, edit, or delete events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="all">All Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No events found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium max-w-[250px] truncate">{event.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatEventDate(event.startDate)}</TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate">
                              {event.isVirtual ? 'Virtual Event' : event.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSelectEvent(event)}
                                title="View details"
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEventToDelete(event.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setActiveSection('announce');
                                    }}
                                  >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Announce
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No events found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium max-w-[250px] truncate">{event.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatEventDate(event.startDate)}</TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate">
                              {event.isVirtual ? 'Virtual Event' : event.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSelectEvent(event)}
                                title="View details"
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEventToDelete(event.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No events found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium max-w-[250px] truncate">{event.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatEventDate(event.startDate)}</TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate">
                              {event.isVirtual ? 'Virtual Event' : event.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSelectEvent(event)}
                                title="View details"
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEventToDelete(event.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent && activeSection !== 'announce'} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                    <p className="mt-1">{formatEventDate(selectedEvent.startDate)}</p>
                    {selectedEvent.endDate && (
                      <p className="mt-1">
                        End: {formatEventDate(selectedEvent.endDate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1">
                      {selectedEvent.isVirtual ? 'Virtual Event' : selectedEvent.location}
                      {selectedEvent.isVirtual && selectedEvent.virtualLink && (
                        <div className="mt-1">
                          <a
                            href={selectedEvent.virtualLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Join Link
                          </a>
                        </div>
                      )}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <div className="mt-1 prose max-w-none">
                    <p>{selectedEvent.description}</p>
                  </div>
                </div>

                {selectedEvent.imageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Image</h3>
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.title}
                      className="mt-1 rounded-md object-cover w-full max-h-64"
                    />
                  </div>
                )}

                {selectedEvent.StartupCall && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Related Startup Call</h3>
                    <p className="mt-1">{selectedEvent.StartupCall.title}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleEditEvent(selectedEvent)}
                  >
                    Edit Event
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setEventToDelete(selectedEvent.id);
                      setSelectedEvent(null);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => setActiveSection('announce')}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Announce
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteEvent}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  const renderAnnounceSection = () => {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4"
              onClick={() => {
                setActiveSection('manage');
                if (selectedEvent) setSelectedEvent(null);
              }}
            >
              ← Back to Events
            </Button>
            <h1 className="text-3xl font-bold">
              {selectedEvent ? `Announce: ${selectedEvent.title}` : 'Event Announcer'}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEvent ? 'Announce Selected Event' : 'Announce Events'}
            </CardTitle>
            <CardDescription>
              Announce events to social media platforms and email subscribers using Pipedream integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/30">
                  <h3 className="font-medium">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-500">
                    {formatEventDate(selectedEvent.startDate)}
                  </p>
                  <p className="mt-2 text-sm">{selectedEvent.description.substring(0, 150)}...</p>
                </div>
                <EventAnnouncement eventId={selectedEvent.id} />
              </div>
            ) : (
              <EventAnnouncement showList={true} />
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <Layout title="Event Management | Admin">
      <div className="container mx-auto py-6 space-y-6 min-h-[calc(100vh-4rem)]">
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

        <div className="flex space-x-2">
          <Button 
            variant={activeSection === 'manage' ? 'default' : 'outline'} 
            onClick={() => setActiveSection('manage')}
            className="flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Manage Events
          </Button>
          <Button 
            variant={activeSection === 'announce' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveSection('announce');
              setSelectedEvent(null);
            }}
            className="flex items-center"
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Announce Events
          </Button>
        </div>

        {activeSection === 'announce' ? renderAnnounceSection() : renderEventList()}
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