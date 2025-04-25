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
  eventUrl?: string;
  isPublic: boolean;
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
    eventUrl: '',
    isPublic: true,
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
  
  // Handle switch changes
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };
  
  // Reset form
  const resetForm = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setFormData({
      title: '',
      description: '',
      startDate: formattedDate,
      startTime: '09:00',
      endDate: formattedDate,
      endTime: '10:00',
      location: '',
      eventUrl: '',
      isPublic: true,
    });
    setCurrentEvent(null);
  };
  
  // Open dialog for new event
  const handleNewEvent = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing
  const handleEditEvent = (event: Event) => {
    setCurrentEvent(event);
    
    // Format dates for form
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: formatDate(startDate),
      startTime: formatTime(startDate),
      endDate: formatDate(endDate),
      endTime: formatTime(endDate),
      location: event.location || '',
      eventUrl: event.eventUrl || '',
      isPublic: event.isPublic,
    });
    setIsDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteConfirmation = (event: Event) => {
    setCurrentEvent(event);
    setIsDeleteDialogOpen(true);
  };
  
  // Submit form to create or update event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location,
        eventUrl: formData.eventUrl,
        isPublic: formData.isPublic,
      };
      
      if (currentEvent) {
        // Update existing event
        await axios.put(`/api/events/${currentEvent.id}`, payload);
        toast({
          title: 'Success',
          description: 'Event updated successfully',
        });
      } else {
        // Create new event
        await axios.post('/api/events', payload);
        toast({
          title: 'Success',
          description: 'Event created successfully',
        });
      }
      
      // Refresh events list
      const response = await axios.get('/api/events');
      setEvents(response.data);
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        variant: 'destructive',
      });
    }
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
          <Button onClick={handleNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
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
                        <CardFooter className="flex justify-end gap-2 pt-2">
                          {session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteConfirmation(event)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
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
                <Button onClick={handleNewEvent} className="mt-4">
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
                    <TableHead>Visibility</TableHead>
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
                        ) : event.eventUrl ? (
                          <div className="flex items-center">
                            <Globe className="mr-1 h-4 w-4" />
                            Virtual
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.isPublic ? (
                          <Badge>Public</Badge>
                        ) : (
                          <Badge variant="outline">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(event)}>
                            <Trash2 className="h-4 w-4" />
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
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>
              {currentEvent
                ? 'Update the details of this event'
                : 'Fill in the details to create a new event'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Physical location or leave blank for virtual events"
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventUrl">Event URL</Label>
                  <Input
                    id="eventUrl"
                    name="eventUrl"
                    value={formData.eventUrl}
                    onChange={handleInputChange}
                    placeholder="Link to virtual meeting or event page"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={handleSwitchChange}
                    id="isPublic"
                  />
                  <Label htmlFor="isPublic">Make this event public</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
            <DialogTitle>Delete Event</DialogTitle>
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