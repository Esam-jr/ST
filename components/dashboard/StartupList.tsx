import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ExternalLink } from 'lucide-react';

type StartupListProps = {
  userRole: string;
  userId?: string;
};

// Mock data for demo purposes
const mockStartups = [
  {
    id: '1',
    name: 'EcoTech Solutions',
    description: 'Sustainable technology solutions for reducing carbon footprint in urban environments.',
    industry: ['CleanTech', 'Sustainability'],
    stage: 'Seed',
    status: 'ACCEPTED',
    score: 8.5,
    createdAt: '2025-03-15T10:30:00Z',
    founder: {
      id: 'user1',
      name: 'Jessica Smith',
    },
  },
  {
    id: '2',
    name: 'HealthTech Innovations',
    description: 'AI-powered healthcare diagnostics for early disease detection.',
    industry: ['HealthTech', 'AI'],
    stage: 'Series A',
    status: 'ACCEPTED',
    score: 9.2,
    createdAt: '2025-02-20T15:45:00Z',
    founder: {
      id: 'user1',
      name: 'Jessica Smith',
    },
  },
  {
    id: '3',
    name: 'EdTech Pioneers',
    description: 'Virtual reality educational platform for immersive learning experiences.',
    industry: ['EdTech', 'VR/AR'],
    stage: 'Pre-seed',
    status: 'UNDER_REVIEW',
    score: 7.8,
    createdAt: '2025-04-05T09:15:00Z',
    founder: {
      id: 'user2',
      name: 'Michael Thomas',
    },
  },
  {
    id: '4',
    name: 'FinTech Revolution',
    description: 'Blockchain-based payment system for secure cross-border transactions.',
    industry: ['FinTech', 'Blockchain'],
    stage: 'Seed',
    status: 'SUBMITTED',
    score: null,
    createdAt: '2025-04-10T14:20:00Z',
    founder: {
      id: 'user3',
      name: 'Ava Johnson',
    },
  },
  {
    id: '5',
    name: 'AgroTech Solutions',
    description: 'Smart farming technology using IoT sensors and data analytics.',
    industry: ['AgTech', 'IoT'],
    stage: 'Pre-seed',
    status: 'ACCEPTED',
    score: 8.9,
    createdAt: '2025-03-25T11:10:00Z',
    founder: {
      id: 'user4',
      name: 'David Brown',
    },
  },
];

export default function StartupList({ userRole, userId }: StartupListProps) {
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Filter startups based on user role
      let filteredStartups = [...mockStartups];
      
      if (userRole === 'ENTREPRENEUR' && userId) {
        filteredStartups = mockStartups.filter(startup => startup.founder.id === userId);
      }
      
      setStartups(filteredStartups);
      setIsLoading(false);
    }, 800);
  }, [userRole, userId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'secondary';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border-b pb-4 border-border">
              <div className="mb-2 h-4 w-1/4 rounded bg-muted"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-muted"></div>
              <div className="mb-2 h-3 w-1/2 rounded bg-muted"></div>
              <div className="flex justify-between">
                <div className="h-3 w-1/5 rounded bg-muted"></div>
                <div className="h-3 w-1/5 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (startups.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No startups found</CardTitle>
          <CardDescription>
            {userRole === 'ENTREPRENEUR' ? (
              <>
                You haven't submitted any startup ideas yet.
              </>
            ) : (
              'There are no startups available at the moment.'
            )}
          </CardDescription>
        </CardHeader>
        {userRole === 'ENTREPRENEUR' && (
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/submit">Submit your first idea</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>
            {userRole === 'ENTREPRENEUR' ? 'My Startups' : 'All Startups'}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/startups">
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="divide-y divide-border">
          {startups.map((startup) => (
            <Link 
              key={startup.id} 
              href={`/startups/${startup.id}`} 
              className="block px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-primary">
                  {startup.name}
                </div>
                <Badge variant={getStatusBadgeVariant(startup.status) as any}>
                  {startup.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="mt-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {startup.description}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {startup.industry.map((ind: string) => (
                    <Badge key={ind} variant="outline" className="bg-muted/50">
                      {ind}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">{startup.stage}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
