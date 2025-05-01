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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Building,
  Star,
  Check,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
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

interface UserApplication {
  id: string;
  opportunityId: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  createdAt: string;
}

export default function SponsorshipOpportunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(null);
  const [userApplication, setUserApplication] = useState<UserApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  
  useEffect(() => {
    // Redirect if not authenticated sponsor
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + router.asPath);
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'SPONSOR') {
      router.push('/dashboard');
    } else if (sessionStatus === 'authenticated' && id) {
      fetchOpportunityData();
    }
  }, [sessionStatus, session, router, id]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch opportunity details
      const opportunityResponse = await axios.get(`/api/sponsorship-opportunities/${id}`);
      setOpportunity(opportunityResponse.data);
      
      // Fetch user's application for this opportunity (if exists)
      try {
        const applicationResponse = await axios.get(`/api/sponsors/me/applications/${id}`);
        if (applicationResponse.data) {
          setUserApplication(applicationResponse.data);
        }
      } catch (error) {
        // No application found - this is expected for opportunities user hasn't applied to
        console.log('No application found for this opportunity');
      }
    } catch (error) {
      console.error('Error fetching opportunity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load opportunity data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'withdrawn':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Check if opportunity has a deadline and if it's in the past
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    return deadlineDate < now;
  };

  // Get formatted application date
  const getFormattedApplicationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle withdraw application
  const handleWithdrawApplication = async () => {
    if (!userApplication) return;
    
    if (!window.confirm('Are you sure you want to withdraw your application?')) {
      return;
    }
    
    try {
      await axios.patch(`/api/sponsorship-applications/${userApplication.id}`, {
        status: 'withdrawn'
      });
      
      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn',
      });
      
      // Update local state
      setUserApplication({
        ...userApplication,
        status: 'withdrawn'
      });
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast({
        title: 'Error',
        description: 'Failed to withdraw application',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout title="Sponsorship Opportunity Details">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsor/opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!opportunity) {
    return (
      <Layout title="Opportunity Not Found">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsor/opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Opportunity Not Found</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">The sponsorship opportunity you are looking for could not be found.</p>
              <Link href="/sponsor/opportunities">
                <Button>Return to All Opportunities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${opportunity.title} | Sponsorship Opportunity`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link href="/sponsor/opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{opportunity.title}</h1>
              <div className="flex items-center mt-1">
                {opportunity.deadline && (
                  <Badge 
                    className={isDeadlinePassed(opportunity.deadline) 
                      ? "bg-red-100 text-red-800 border-red-200 mr-2" 
                      : "bg-green-100 text-green-800 border-green-200 mr-2"}
                  >
                    {isDeadlinePassed(opportunity.deadline) ? "Deadline Passed" : "Open for Applications"}
                  </Badge>
                )}
                {userApplication && (
                  getStatusBadge(userApplication.status)
                )}
              </div>
            </div>
          </div>
          <div>
            {!userApplication && !isDeadlinePassed(opportunity.deadline) && (
              <Link href={`/sponsor/opportunities/${opportunity.id}/apply`}>
                <Button className="flex items-center">
                  Express Interest
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {userApplication && userApplication.status === 'pending' && (
              <Button
                variant="outline"
                onClick={handleWithdrawApplication}
              >
                Withdraw Application
              </Button>
            )}
          </div>
        </div>

        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="details">Opportunity Details</TabsTrigger>
            {userApplication && (
              <TabsTrigger value="application">My Application</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
                {opportunity.startupCall && (
                  <CardDescription className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    Associated with {opportunity.startupCall.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{opportunity.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Funding Range</h3>
                    <div className="flex items-center text-gray-700">
                      <DollarSign className="h-5 w-5 mr-2 text-primary" />
                      <span>
                        {formatCurrency(opportunity.minAmount, opportunity.currency)} - 
                        {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Application Deadline</h3>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span>{formatDate(opportunity.deadline)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Sponsor Benefits</h3>
                  {opportunity.benefits.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {opportunity.benefits.map((benefit, index) => (
                        <li key={index} className="text-gray-700">{benefit}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No specific benefits listed</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <div className="text-sm text-gray-500 mb-4">
                  Created on {new Date(opportunity.createdAt).toLocaleDateString()}
                </div>
                {!userApplication && !isDeadlinePassed(opportunity.deadline) && (
                  <Link href={`/sponsor/opportunities/${opportunity.id}/apply`}>
                    <Button className="flex items-center">
                      Express Interest
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {userApplication && (
            <TabsContent value="application" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Application</CardTitle>
                  <CardDescription className="flex items-center">
                    Application Status: {getStatusBadge(userApplication.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Proposed Amount</h3>
                      <div className="flex items-center text-gray-700">
                        <DollarSign className="h-5 w-5 mr-2 text-primary" />
                        <span>{formatCurrency(userApplication.amount, userApplication.currency)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Application Date</h3>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        <span>{getFormattedApplicationDate(userApplication.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {userApplication.message && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Your Message</h3>
                        <p className="text-gray-700 whitespace-pre-line">{userApplication.message}</p>
                      </div>
                    </>
                  )}

                  {userApplication.status === 'approved' && (
                    <>
                      <Separator />
                      <div className="bg-green-50 border border-green-100 rounded-md p-4">
                        <div className="flex items-start">
                          <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-800 mb-1">Application Approved</h4>
                            <p className="text-green-700">
                              Congratulations! Your application has been approved. You can view your sponsorship details in your sponsor dashboard.
                            </p>
                            <Link href="/sponsor-dashboard" className="text-primary hover:underline flex items-center mt-2">
                              Go to Sponsor Dashboard
                              <ExternalLink className="ml-1 h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  {userApplication.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={handleWithdrawApplication}
                    >
                      Withdraw Application
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
} 