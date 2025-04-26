import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

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

interface AdvertisementCardProps {
  advertisement: Advertisement;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export default function AdvertisementCard({ 
  advertisement, 
  variant = 'default',
  className = '' 
}: AdvertisementCardProps) {
  const { 
    id, 
    title, 
    description, 
    content, 
    imageUrl, 
    mediaUrl, 
    publishedDate, 
    startupCall 
  } = advertisement;
  
  // Format the published date
  const formattedDate = publishedDate 
    ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true })
    : formatDistanceToNow(new Date(advertisement.createdAt), { addSuffix: true });
  
  // Handle featured variant
  if (variant === 'featured') {
    return (
      <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}>
        {imageUrl ? (
          <div className="relative h-60 w-full">
            <Image 
              src={imageUrl} 
              alt={title}
              layout="fill"
              objectFit="cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
        ) : (
          <div className="h-60 w-full bg-gradient-to-br from-primary/80 to-primary/40"></div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="mb-4 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{formattedDate}</span>
            <Link href={`/advertisements/${id}`} passHref>
              <Button variant="secondary">
                Read More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle compact variant
  if (variant === 'compact') {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex">
          {imageUrl && (
            <div className="relative h-32 w-32 flex-shrink-0">
              <Image 
                src={imageUrl}
                alt={title}
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}
          <div className="flex flex-col justify-between p-4">
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
              <Link href={`/advertisements/${id}`} passHref>
                <Button size="sm" variant="link">Read More</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card className={className}>
      {imageUrl && (
        <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
          <Image 
            src={imageUrl}
            alt={title}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="line-clamp-4">{description}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {startupCall && (
          <Badge variant="outline">
            {startupCall.title}
          </Badge>
        )}
        <Link href={`/advertisements/${id}`} passHref>
          <Button>
            Read More
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 