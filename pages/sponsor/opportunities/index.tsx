import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  Clock,
  Building,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Define types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  deadline?: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
  _count?: {
    applications: number;
  };
}

export default function SponsorOpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [userApplications, setUserApplications] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Redirect if not authenticated sponsor
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/sponsor/opportunities');
    } else if (status === 'authenticated' && session?.user?.role !== 'SPONSOR') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchOpportunities();
      fetchUserApplications();
    }
  }, [status, session, router]);

  // Filter opportunities whenever search query changes
  useEffect(() => {
    if (opportunities.length > 0) {
      const filtered = opportunities.filter(opportunity => 
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOpportunities(filtered);
    }
  }, [searchQuery, opportunities]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sponsorship-opportunities?status=active');
      setOpportunities(response.data);
      setFilteredOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching sponsorship opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sponsorship opportunities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const response = await axios.get('/api/sponsors/me/applications');
      
      // Create a map of opportunity ID to application status
      const applicationMap: Record<string, string> = {};
      response.data.forEach((app: any) => {
        applicationMap[app.opportunityId] = app.status;
      });
      
      setUserApplications(applicationMap);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get application button text based on application status
  const getApplicationButtonText = (opportunityId: string) => {
    const status = userApplications[opportunityId];
    
    if (!status) return 'Express Interest';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Application Pending';
      case 'approved':
        return 'Application Approved';
      case 'rejected':
        return 'Application Rejected';
      case 'withdrawn':
        return 'Application Withdrawn';
      default:
        return 'View Application';
    }
  };

  // Get application button variant based on application status
  const getApplicationButtonVariant = (opportunityId: string) => {
    const status = userApplications[opportunityId];
    
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'outline';
      case 'rejected':
        return 'outline';
      case 'withdrawn':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Check if opportunity has a deadline and if it's in the past
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    return deadlineDate < now;
  };

  // Handle clicking on opportunity card
  const handleOpportunityClick = (opportunityId: string) => {
    router.push(`/sponsor/opportunities/${opportunityId}`);
  };

  return (
    <Layout title="Sponsorship Opportunities">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sponsorship Opportunities</h1>
            <p className="text-gray-600 mt-1">
              Discover opportunities to sponsor promising startup initiatives
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search opportunities..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-2">No sponsorship opportunities are currently available.</p>
              <p className="text-gray-500">Please check back later or contact the administrators.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card 
                key={opportunity.id} 
                className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleOpportunityClick(opportunity.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                    {opportunity.deadline && (
                      <Badge 
                        className={isDeadlinePassed(opportunity.deadline) 
                          ? "bg-red-100 text-red-800 border-red-200" 
                          : "bg-green-100 text-green-800 border-green-200"}
                      >
                        {isDeadlinePassed(opportunity.deadline) ? "Deadline Passed" : "Open"}
                      </Badge>
                    )}
                  </div>
                  {opportunity.startupCall && (
                    <CardDescription>
                      <span className="flex items-center">
                        <Building className="h-3.5 w-3.5 mr-1" />
                        {opportunity.startupCall.title}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <p className="text-gray-700 line-clamp-3 mb-4">
                    {opportunity.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-primary" />
                      {formatCurrency(opportunity.minAmount, opportunity.currency)} - 
                      {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                    </div>
                    
                    {opportunity.deadline && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        Deadline: {formatDate(opportunity.deadline)}
                      </div>
                    )}
                    
                    {opportunity.benefits.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600 mt-1">
                        <Star className="h-4 w-4 mr-2 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium mb-1">Benefits include:</div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {opportunity.benefits.slice(0, 2).map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                            {opportunity.benefits.length > 2 && (
                              <li className="text-primary">+{opportunity.benefits.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button 
                    variant={getApplicationButtonVariant(opportunity.id)}
                    size="sm"
                    className="flex items-center"
                    disabled={isDeadlinePassed(opportunity.deadline) || !!userApplications[opportunity.id]}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!userApplications[opportunity.id]) {
                        router.push(`/sponsor/opportunities/${opportunity.id}/apply`);
                      }
                    }}
                  >
                    {getApplicationButtonText(opportunity.id)}
                    {!userApplications[opportunity.id] && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 