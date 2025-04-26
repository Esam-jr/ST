import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import AdvertisementCard from '@/components/ui/AdvertisementCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
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

export default function AdvertisementsPage() {
  const { toast } = useToast();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        
        // Only get published advertisements
        const response = await axios.get('/api/advertisements?status=PUBLISHED');
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
  }, [toast]);
  
  return (
    <Layout 
      title="Advertisements & Announcements"
      description="The latest announcements and opportunities for entrepreneurs and startups"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Advertisements & Announcements
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Stay updated with the latest startup call opportunities, events, and important announcements
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : advertisements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-semibold">No advertisements available</h3>
            <p className="mt-2 text-lg text-muted-foreground">
              Check back later for updates and announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {advertisements.map((advertisement) => (
              <AdvertisementCard key={advertisement.id} advertisement={advertisement} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 