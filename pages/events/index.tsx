import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Search, MapPin, ArrowRight } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function PublicEventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use SWR for data fetching with auto-revalidation
  const { data: events = [], error } = useSWR('/api/public/events', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });
  
  // Filter events based on search term
  const filteredEvents = events.filter((event: any) => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Events | Startup Network">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join our community events, workshops, and networking opportunities to connect with fellow entrepreneurs.
          </p>
        </div>

        <div className="flex w-full max-w-md mx-auto items-center space-x-2 mb-12">
          <Input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 max-w-3xl mx-auto">
            Unable to load events. Please try again later.
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No upcoming events at the moment. Please check back soon!</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No events match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredEvents.map((event: any) => (
              <div key={event.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                {event.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center text-sm text-blue-600 mb-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(event.startDate)}
                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {event.isVirtual ? 'Virtual Event' : event.location || 'Location TBA'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {event.type}
                    </span>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 