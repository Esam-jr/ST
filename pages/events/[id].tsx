import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Globe, Link2, MapPin } from 'lucide-react';

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

type Props = {
  event: Event;
};

export default function EventDetail({ event }: Props) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  
  const { 
    title, 
    description, 
    startDate, 
    endDate, 
    location, 
    isVirtual, 
    virtualLink, 
    imageUrl, 
    type,
    startupCall 
  } = event;
  
  // Format date and time
  const eventDate = format(new Date(startDate), 'EEEE, MMMM d, yyyy');
  const startTime = format(new Date(startDate), 'h:mm a');
  const endTime = format(new Date(endDate), 'h:mm a');

  // Badge color based on event type
  const getBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'WORKSHOP': return 'default';
      case 'WEBINAR': return 'secondary';
      case 'DEADLINE': return 'destructive';
      case 'ANNOUNCEMENT': return 'outline';
      case 'NETWORKING': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Layout
      title={title}
      description={description || `${type} event on ${eventDate}`}
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Badge variant={getBadgeVariant(type)} className="mb-4">
          {type.charAt(0) + type.slice(1).toLowerCase()}
        </Badge>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
          {title}
        </h1>
        
        {imageUrl && (
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg mb-8">
            <Image 
              src={imageUrl} 
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            {description && (
              <div className="prose max-w-none mb-8">
                <p className="text-lg">{description}</p>
              </div>
            )}
            
            {startupCall && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">Related Startup Call</h2>
                <p className="mb-4">{startupCall.title}</p>
                <Button variant="outline" asChild>
                  <Link href={`/startup-calls/${startupCall.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">{eventDate}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">{startTime} - {endTime}</p>
                </div>
              </div>
              
              {(location || isVirtual) && (
                <div className="flex items-start">
                  {isVirtual ? (
                    <Globe className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                  ) : (
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{isVirtual ? 'Online Event' : 'Location'}</p>
                    {isVirtual && virtualLink ? (
                      <a 
                        href={virtualLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline flex items-center"
                      >
                        Join Online <Link2 className="ml-1 h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">{location || 'Virtual'}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {isVirtual && virtualLink && (
              <Button className="w-full mt-6" asChild>
                <a href={virtualLink} target="_blank" rel="noopener noreferrer">
                  Join Event
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    if (!event) {
      return {
        notFound: true,
      };
    }
    
    // Check if event date has passed (can be adjusted based on your requirements)
    const eventEndDate = new Date(event.endDate);
    const now = new Date();
    
    // Uncomment to prevent access to past events
    // if (eventEndDate < now) {
    //   return {
    //     notFound: true,
    //   };
    // }
    
    return {
      props: {
        event: JSON.parse(JSON.stringify(event)),
      },
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      notFound: true,
    };
  }
}; 