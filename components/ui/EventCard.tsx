import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Globe, Link2, ImageOff } from 'lucide-react';

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

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
  priority?: boolean; // Add priority prop for important images
}

export default function EventCard({ 
  event, 
  variant = 'default',
  className = '',
  priority = false
}: EventCardProps) {
  const { 
    id, 
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

  // State to track image loading
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  // Format date and time
  const formattedDate = format(new Date(startDate), 'MMMM d, yyyy');
  const formattedStartTime = format(new Date(startDate), 'h:mm a');
  const formattedEndTime = format(new Date(endDate), 'h:mm a');
  const formattedTimeRange = `${formattedStartTime} - ${formattedEndTime}`;
  
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

  // Handle image success
  const onImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Handle image error fallback
  const onImageError = () => {
    setIsImageError(true);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    
    // Optimize external images
    if (url.startsWith('http')) {
      // Check if it's already using an image optimization service
      if (url.includes('imagedelivery.net') || url.includes('cloudinary.com')) {
        return url;
      }
      return url;
    }
    
    // For relative paths, prepend with /
    if (!url.startsWith('/')) {
      return `/${url}`;
    }
    
    return url;
  };
  
  // Featured variant
  if (variant === 'featured') {
    return (
      <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}>
        {imageUrl && !isImageError ? (
          <div className="relative h-60 w-full">
            <Image 
              src={getImageUrl(imageUrl)}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={onImageLoad}
              onError={onImageError}
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
        ) : (
          <div className="h-60 w-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-white/70" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <Badge variant={getBadgeVariant(type)} className="mb-2">
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </Badge>
          
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          
          <div className="flex items-center mb-4">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">{formattedTimeRange}</span>
          </div>
          
          <Link href={`/events/${id}`} passHref>
            <Button variant="secondary">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex">
          {imageUrl && !isImageError ? (
            <div className="relative h-32 w-32 flex-shrink-0">
              <Image 
                src={getImageUrl(imageUrl)}
                alt={title}
                fill
                sizes="128px"
                className={`object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={onImageLoad}
                onError={onImageError}
                loading="lazy"
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse"></div>
              )}
            </div>
          ) : (
            <div className="h-32 w-32 flex-shrink-0 bg-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex flex-col justify-between p-4">
            <div>
              <Badge variant={getBadgeVariant(type)} className="mb-2">
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Badge>
              <h3 className="font-bold">{title}</h3>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formattedDate}</span>
              </div>
            </div>
            
            <Link href={`/events/${id}`} passHref>
              <Button size="sm" variant="link">View Details</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card className={className}>
      {imageUrl && !isImageError ? (
        <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
          <Image 
            src={getImageUrl(imageUrl)}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={`object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={onImageLoad}
            onError={onImageError}
            loading="lazy"
          />
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse"></div>
          )}
        </div>
      ) : (
        imageUrl && isImageError && (
          <div className="h-48 w-full bg-muted flex items-center justify-center">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
        )
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={getBadgeVariant(type)}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </Badge>
          
          {startupCall && (
            <Badge variant="outline">
              {startupCall.title}
            </Badge>
          )}
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{formattedDate}</span>
        </div>
        
        <div className="flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{formattedTimeRange}</span>
        </div>
        
        {location && (
          <div className="flex items-center mb-2">
            {isVirtual ? (
              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            ) : (
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span className="text-sm">{location}</span>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {description}
          </p>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href={`/events/${id}`} passHref className="w-full">
          <Button className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 