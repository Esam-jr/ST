import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { Calendar, FileText, Plus, Edit, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import useSWR, { mutate } from 'swr';

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Use SWR for data fetching with auto-revalidation
  const { data: events = [], error, mutate: refreshEvents } = useSWR('/api/events', fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when tab regains focus
  });
  
  // Filter events based on search term
  const filteredEvents = events.filter((event: any) => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    try {
      await axios.delete(`/api/events/${id}`);
      
      // Optimistically update the UI
      refreshEvents(
        events.filter((event: any) => event.id !== id),
        { revalidate: true }
      );
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <Layout title="Events Management | Admin">
      <div className="container mx-auto py-6 space-y-6">
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

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Events Management</h1>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Event
            </Button>
          </Link>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
          <Input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            Error loading events. Please refresh the page.
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No events found. Create your first event.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No events match your search.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event: any) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.startDate)}
                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.location}
                      {event.isVirtual && " (Virtual)"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/events/edit/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                        >
                          {deletingId === event.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
} 

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/events',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
}; 