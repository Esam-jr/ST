import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Search,
  Calendar,
  Clock,
  ArrowUpDown,
  Filter,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
// Define types
type CallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'NOT_APPLIED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: CallStatus;
  applicationDeadline: string;
  publishedDate: string;
  industry: string;
  location: string;
  fundingAmount?: string;
  requirements: string[];
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor?: string;
  applicationProcess: string;
  applicationStatus?: ApplicationStatus;
}

export default function StartupCalls() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('open');

  // Fetch startup calls from API
  useEffect(() => {
    const fetchStartupCalls = async () => {
      try {
        const response = await axios.get('/api/startup-calls');
        setStartupCalls(response.data);
      } catch (error) {
        console.error('Error fetching startup calls:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch startup calls',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStartupCalls();
  }, [toast]);

  // Filter and sort functions
  const filteredCalls = startupCalls.filter(call => {
    const matchesQuery = call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       call.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || call.industry === industryFilter;
    const matchesStatus = 
      (activeTab === 'open' && call.status === 'PUBLISHED') || 
      (activeTab === 'closed' && call.status === 'CLOSED');
    
    return matchesQuery && matchesIndustry && matchesStatus;
  });

  const sortedCalls = [...filteredCalls].sort((a, b) => {
    if (sortDirection === 'asc') {
      return new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime();
    } else {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    }
  });

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'NOT_APPLIED':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50">Not Applied</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-50">Applied</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">Under Review</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-50 text-green-600 hover:bg-green-50">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-50">Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge className="bg-gray-50 text-gray-600 hover:bg-gray-50">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIndustries = () => {
    const industries = new Set<string>();
    startupCalls.forEach(call => industries.add(call.industry));
    return Array.from(industries);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Startup Calls | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Startup Calls | Find Opportunities">
      <div className="min-h-screen">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Startup Calls</h1>
                <p className="text-muted-foreground mt-2">
                  Browse and apply for startup funding and support opportunities
                </p>
              </div>
              {!session && (
                <Button asChild>
                  <Link href="/auth/signin?callbackUrl=/startup-calls">
                    Sign in to apply
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search startup calls..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {getIndustries().map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline" 
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Date {sortDirection === 'asc' ? 'Oldest' : 'Newest'}
                </Button>
              </div>
            </div>

            {/* Tabs for different call types */}
            <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="open">Open Calls</TabsTrigger>
                <TabsTrigger value="closed">Closed Calls</TabsTrigger>
              </TabsList>
              
              <TabsContent value="open" className="mt-6 space-y-6">
                {sortedCalls.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <h3 className="mb-2 text-lg font-medium">No open calls available</h3>
                    <p className="text-muted-foreground">
                      Check back later for new opportunities or adjust your search criteria.
                    </p>
                  </div>
                ) : (
                  sortedCalls.map((call) => (
                    <CallCard 
                      key={call.id} 
                      call={call} 
                      onViewDetails={() => router.push(`/startup-calls/${call.id}`)}
                      onApply={() => router.push(`/startup-calls/${call.id}/apply`)}
                      formatDate={formatDate}
                      getDaysLeft={getDaysLeft}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="closed" className="mt-6 space-y-6">
                {sortedCalls.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <h3 className="mb-2 text-lg font-medium">No closed calls available</h3>
                    <p className="text-muted-foreground">
                      Adjust your search criteria to find closed calls.
                    </p>
                  </div>
                ) : (
                  sortedCalls.map((call) => (
                    <CallCard 
                      key={call.id} 
                      call={call} 
                      onViewDetails={() => router.push(`/startup-calls/${call.id}`)}
                      showApplicationStatus={call.applicationStatus && call.applicationStatus !== 'NOT_APPLIED'}
                      onViewApplication={call.applicationStatus && call.applicationStatus !== 'NOT_APPLIED' 
                        ? () => router.push(`/applications/${call.id}`)
                        : undefined
                      }
                      formatDate={formatDate}
                      getDaysLeft={getDaysLeft}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </Layout>
  );
}

interface CallCardProps {
  call: StartupCall;
  onViewDetails: () => void;
  onApply?: () => void;
  onViewApplication?: () => void;
  showApplicationStatus?: boolean;
  formatDate: (date: string) => string;
  getDaysLeft: (deadline: string) => number;
  getStatusBadge: (status: ApplicationStatus) => JSX.Element;
}

function CallCard({ 
  call, 
  onViewDetails, 
  onApply, 
  onViewApplication,
  showApplicationStatus = false,
  formatDate,
  getDaysLeft,
  getStatusBadge
}: CallCardProps) {
  const daysLeft = getDaysLeft(call.applicationDeadline);
  const isExpired = daysLeft <= 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{call.title}</CardTitle>
              {call.status === 'CLOSED' && (
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">CLOSED</Badge>
              )}
            </div>
            <CardDescription className="mt-1 max-w-3xl">
              {call.industry} • {call.location}
              {call.fundingAmount && ` • Funding: ${call.fundingAmount}`}
            </CardDescription>
          </div>
          
          {showApplicationStatus && call.applicationStatus && (
            <div className="flex items-center">
              <span className="mr-2 text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(call.applicationStatus)}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {call.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {call.requirements.map((req, index) => (
            <Badge key={index} variant="outline">{req}</Badge>
          ))}
        </div>
        
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-1.5 h-4 w-4" />
            <span>Published: {formatDate(call.publishedDate)}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-1.5 h-4 w-4" />
            <span>Deadline: {formatDate(call.applicationDeadline)}</span>
          </div>
          
          <div className={`flex items-center ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
            <Clock className="mr-1.5 h-4 w-4" />
            <span>{isExpired ? 'Expired' : `${daysLeft} days left`}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onViewDetails}>
          View Details
        </Button>
        
        {!isExpired && onApply && call.applicationStatus === 'NOT_APPLIED' && (
          <Button onClick={onApply}>
            Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
        
        {onViewApplication && (
          <Button onClick={onViewApplication}>
            View Application
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}