import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Share2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import axios from 'axios';
import prisma from '@/lib/prisma';

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Time formatter helper
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Define the Event type
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  imageUrl?: string;
  type: string;
  createdAt: string;
}

export default function EventDetailPage({ fallbackData }: { fallbackData: Event }) {
  const router = useRouter();
  const { id } = router.query;
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Use SWR with fallback data from getStaticProps
  const { data: event, error } = useSWR<Event>(
    id ? `/api/public/events/${id}` : null, 
    fetcher, 
    { fallbackData }
  );
  
  // Handle loading and error states
  if (router.isFallback || (!event && !error)) {
    return (
      <Layout title="Loading... | Events">
        <div className="container mx-auto py-16 px-4 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-xl">Loading event details...</div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !event) {
    return (
      <Layout title="Event Not Found | Events">
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-3xl mx-auto bg-red-50 p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Link href="/events">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Share functionality
  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      })
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      setIsShareOpen(!isShareOpen);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setIsShareOpen(false);
  };

  return (
    <Layout title={`${event.title} | Events`}>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/events" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </div>
          
          {event.imageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-md">
              <img 
                src={event.imageUrl} 
                alt={event.title} 
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          )}
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="relative">
                  <Button variant="outline" size="sm" onClick={shareEvent}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {isShareOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10">
                      <button 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                        onClick={copyToClipboard}
                      >
                        Copy link
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div>
                      {formatDate(event.startDate)}
                      {event.endDate && (
                        <>
                          <br />
                          <span>to {formatDate(event.endDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div>
                      {formatTime(event.startDate)}
                      {event.endDate && ` - ${formatTime(event.endDate)}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div>{event.isVirtual ? 'Virtual Event' : event.location || 'TBA'}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="rounded-full bg-blue-100 p-1 mr-3">
                    <span className="inline-block text-xs font-medium text-blue-800 px-2">
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>
              
              {event.isVirtual && event.virtualLink && (
                <div className="mb-8 p-4 border border-blue-200 rounded-md bg-blue-50">
                  <div className="font-medium mb-2">Virtual Event Link</div>
                  <a 
                    href={event.virtualLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    Join the event
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              )}
              
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold mb-4">About this event</h2>
                <div className="whitespace-pre-line">{event.description}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Get the most recent events to pre-render
  const events = await prisma.event.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  });
  
  // Add explicit type to event parameter
  const paths = events.map((event: { id: string }) => ({
    params: { id: event.id.toString() },
  }));
  
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const id = params?.id;
    
    if (!id || typeof id !== 'string') {
      return { notFound: true };
    }
    
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        isVirtual: true,
        virtualLink: true,
        imageUrl: true,
        type: true,
        createdAt: true,
      },
    });
    
    if (!event) {
      return { notFound: true };
    }
    
    // Convert dates to strings for serialization
    return {
      props: {
        fallbackData: JSON.parse(JSON.stringify(event)),
      },
      revalidate: 60, // Revalidate every minute
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}; 