import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Link2, Globe } from 'lucide-react';

// Calendar component (simplified version)
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

type Event = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  type: string;
  startupCallId?: string;
  createdAt: string;
  updatedAt: string;
};

interface EventCalendarProps {
  view?: 'calendar' | 'list';
  showAddButton?: boolean;
}

export default function EventCalendar({ view = 'list', showAddButton = true }: EventCalendarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    isVirtual: false,
    virtualLink: '',
    type: 'ANNOUNCEMENT', // Default type
    startupCallId: '',
  });
  
  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/events');
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
  }, [toast]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '00:00'}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: 'Error',
          description: 'Invalid date or time format',
          variant: 'destructive',
        });
        return;
      }
      
      // Create object with required fields
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location,
        isVirtual: formData.isVirtual,
        virtualLink: formData.virtualLink,
        type: formData.type,
        startupCallId: formData.startupCallId || undefined,
      };
      
      // Create or update event
      let response;
      if (currentEvent) {
        // Update
        response = await axios.put(`/api/events/${currentEvent.id}`, eventData);
        
        // Update in state
        setEvents(prev => prev.map(event => 
          event.id === currentEvent.id ? response.data : event
        ));
        
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        // Create
        response = await axios.post('/api/events', eventData);
        
        // Add to state
        setEvents(prev => [...prev, response.data]);
        
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }
      
      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        variant: 'destructive',
      });
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      isVirtual: false,
      virtualLink: '',
      type: 'ANNOUNCEMENT',
      startupCallId: '',
    });
    setCurrentEvent(null);
  };
  
  // Open edit dialog with event data
  const handleEdit = (event: Event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toISOString().split('T')[1].substring(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: endDate.toISOString().split('T')[1].substring(0, 5),
      location: event.location || '',
      isVirtual: event.isVirtual || false,
      virtualLink: event.virtualLink || '',
      type: event.type,
      startupCallId: event.startupCallId || '',
    });
    
    setCurrentEvent(event);
    setIsDialogOpen(true);
  };
  
  // Delete event
  const handleDelete = async () => {
    if (!currentEvent) return;
    
    try {
      await axios.delete(`/api/events/${currentEvent.id}`);
      
      // Remove from state
      setEvents(prev => prev.filter(event => event.id !== currentEvent.id));
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      
      setIsDeleteDialogOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  // Filter events for calendar view
  const getEventsForDate = (date: Date) => {
    const formatted = date.toDateString();
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toDateString();
      return eventDate === formatted;
    });
  };
  
  // Get dates with events for calendar
  const datesWithEvents = events.map(event => new Date(event.startDate));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Calendar</h2>
          <p className="text-muted-foreground">Manage and view upcoming events and deadlines</p>
        </div>
        {showAddButton && (
          <div className="mb-6 flex justify-end">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        )}
      </div>
      
      {view === 'calendar' ? (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Events and deadlines organized by date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div className="md:w-1/2">
                <h3 className="font-medium mb-4">
                  Events on {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                
                {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map((event) => (
                      <Card key={event.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {event.location && (
                            <div className="flex items-center text-sm mb-2">
                              <MapPin className="mr-1 h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                          <p className="text-sm">{event.description}</p>
                        </CardContent>
                        <CardFooter className="border-t pt-2 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentEvent(event);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No events scheduled for this date
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Events List</CardTitle>
            <CardDescription>
              All scheduled events and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first event to get started.
                </p>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">{event.description}</div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDate(event.startDate)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(event.startDate)} - {formatTime(event.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.location ? (
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {event.location}
                          </div>
                        ) : event.isVirtual ? (
                          <div className="flex items-center">
                            <Globe className="mr-1 h-4 w-4" />
                            <span>
                            {event.virtualLink ? (
                              <a 
                                href={event.virtualLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Virtual Event
                              </a>
                            ) : 'Virtual Event'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentEvent(event);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Event Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {currentEvent ? 'Update the event details' : 'Create a new event for the calendar'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="isVirtual">Virtual Event?</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVirtual"
                      checked={formData.isVirtual}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVirtual: checked }))}
                    />
                    <Label htmlFor="isVirtual">
                      {formData.isVirtual ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
                
                {formData.isVirtual && (
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="virtualLink">Virtual Link</Label>
                    <Input
                      id="virtualLink"
                      name="virtualLink"
                      value={formData.virtualLink}
                      onChange={handleInputChange}
                      placeholder="https://"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="type">Event Type</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="WORKSHOP">Workshop</option>
                  <option value="WEBINAR">Webinar</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="NETWORKING">Networking</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 