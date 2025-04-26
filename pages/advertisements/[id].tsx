import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

type Advertisement = {
  id: string;
  title: string;
  description: string;
  content: string;
  mediaUrl?: string;
  imageUrl?: string;
  platforms: string[];
  startupCallId?: string;
  status: string;
  publishedDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  startupCall?: {
    id: string;
    title: string;
  };
};

type Props = {
  advertisement: Advertisement;
};

export default function AdvertisementDetail({ advertisement }: Props) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  
  const { 
    title, 
    description, 
    content, 
    imageUrl, 
    mediaUrl, 
    publishedDate, 
    startupCall 
  } = advertisement;
  
  // Format the date for display
  const formattedDate = publishedDate 
    ? format(new Date(publishedDate), 'MMMM d, yyyy')
    : format(new Date(advertisement.createdAt), 'MMMM d, yyyy');

  return (
    <Layout
      title={title}
      description={description}
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
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            {formattedDate}
          </div>
          
          {startupCall && (
            <Badge variant="outline">
              {startupCall.title}
            </Badge>
          )}
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
          {title}
        </h1>
        
        <div className="prose prose-lg max-w-none mb-8">
          <p className="text-xl text-muted-foreground mb-8">
            {description}
          </p>
          
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
        
        {mediaUrl && (
          <div className="mt-8">
            <Button asChild>
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Related Resource
              </a>
            </Button>
          </div>
        )}
        
        {startupCall && (
          <div className="bg-muted p-6 rounded-lg mt-8">
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
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  
  try {
    const advertisement = await prisma.advertisement.findUnique({
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
    
    if (!advertisement || advertisement.status !== 'PUBLISHED') {
      return {
        notFound: true,
      };
    }
    
    return {
      props: {
        advertisement: JSON.parse(JSON.stringify(advertisement)),
      },
    };
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    return {
      notFound: true,
    };
  }
}; 