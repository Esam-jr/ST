import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import AdvertisementCard from '@/components/ui/AdvertisementCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';

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

interface AdvertisementsListProps {
  limit?: number;
  showFeatured?: boolean;
  onlyPublished?: boolean;
  className?: string;
}

export default function AdvertisementsList({
  limit = 3,
  showFeatured = true,
  onlyPublished = true,
  className = '',
}: AdvertisementsListProps) {
  const { toast } = useToast();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        
        if (onlyPublished) {
          params.append('status', 'PUBLISHED');
        }
        
        // Include limit in query
        params.append('limit', limit.toString());
        
        const response = await axios.get(`/api/advertisements?${params.toString()}`);
        setAdvertisements(response.data);
      } catch (error) {
        console.error('Error fetching advertisements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load advertisements',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvertisements();
  }, [toast, limit, onlyPublished]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (advertisements.length === 0) {
    return (
      <div className="text-center py-8">
        <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No advertisements available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back later for updates and announcements.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {showFeatured && advertisements.length > 0 && (
        <div className="mb-8">
          <AdvertisementCard 
            advertisement={advertisements[0]} 
            variant="featured"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advertisements.slice(showFeatured ? 1 : 0, limit).map((ad) => (
          <AdvertisementCard 
            key={ad.id} 
            advertisement={ad}
          />
        ))}
      </div>
      
      {advertisements.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <a href="/advertisements">View All Advertisements</a>
          </Button>
        </div>
      )}
    </div>
  );
} 