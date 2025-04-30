import { useState } from 'react';
import { Button } from '../ui/button';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '../ui/spinner';

interface EventAnnouncementProps {
  eventId?: string;  // Made optional to support both single event and list views
  showList?: boolean;
}

export default function EventAnnouncement({ eventId, showList = false }: EventAnnouncementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(showList);
  const [announcingEvents, setAnnouncingEvents] = useState<Record<string, boolean>>({});

  // Fetch events if in list mode
  if (showList && events.length === 0 && !listLoading) {
    setListLoading(true);
    fetchEvents();
  }

  async function fetchEvents() {
    try {
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setListLoading(false);
    }
  }

  const announceEvent = async (id: string) => {
    if (showList) {
      setAnnouncingEvents(prev => ({ ...prev, [id]: true }));
    } else {
      setIsLoading(true);
      setResults(null);
    }
    
    try {
      const response = await fetch('/api/events/announce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to announce event');
      }
      
      if (!showList) {
        setResults(data.results);
      }
      
      if (data.results?.errors?.length > 0) {
        toast({
          title: 'Event announced with some issues',
          description: data.results.errors.join(', '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Event announced successfully',
          description: 'The event has been announced to all configured platforms',
        });
      }
    } catch (error) {
      console.error('Error announcing event:', error);
      toast({
        title: 'Failed to announce event',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      if (showList) {
        setAnnouncingEvents(prev => ({ ...prev, [id]: false }));
      } else {
        setIsLoading(false);
      }
    }
  };

  // Show list view when showList is true
  if (showList) {
    if (listLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Event Announcer</h2>
        <p className="text-gray-500">Announce events to social media and email subscribers</p>
        
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No events found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-2 text-sm">{event.description.substring(0, 150)}...</p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => announceEvent(event.id)}
                      disabled={announcingEvents[event.id]}
                      className="flex items-center gap-2"
                    >
                      {announcingEvents[event.id] ? (
                        <Spinner size="sm" />
                      ) : (
                        <span>📢</span>
                      )}
                      Announce
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single event view (original functionality)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => eventId && announceEvent(eventId)} 
          disabled={isLoading || !eventId}
          variant="default"
        >
          {isLoading ? 'Announcing...' : 'Announce Event'}
        </Button>
      </div>
      
      {results && (
        <div className="mt-4 border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Announcement Results</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="font-medium">Facebook:</span>
              {results.facebook ? (
                results.facebook.success ? (
                  <span className="text-green-600">Posted successfully</span>
                ) : (
                  <span className="text-red-600">{results.facebook.error}</span>
                )
              ) : (
                <span className="text-gray-400">Not configured</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">LinkedIn:</span>
              {results.linkedin ? (
                results.linkedin.success ? (
                  <span className="text-green-600">Posted successfully</span>
                ) : (
                  <span className="text-red-600">{results.linkedin.error}</span>
                )
              ) : (
                <span className="text-gray-400">Not configured</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              {results.email ? (
                results.email.success ? (
                  <span className="text-green-600">Sent successfully</span>
                ) : (
                  <span className="text-red-600">{results.email.error}</span>
                )
              ) : (
                <span className="text-gray-400">Not configured</span>
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 