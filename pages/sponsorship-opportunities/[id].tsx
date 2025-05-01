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
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Building,
  Star,
  LogIn,
  Info,
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
}

export default function PublicSponsorshipOpportunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchOpportunityData();
    }
  }, [id]);

  // Redirect sponsor users to their specific view
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'SPONSOR' && id) {
      router.push(`/sponsor/opportunities/${id}`);
    }
  }, [sessionStatus, session, id, router]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch opportunity details
      const opportunityResponse = await axios.get(`/api/sponsorship-opportunities/${id}`);
      setOpportunity(opportunityResponse.data);
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

  // Check if opportunity has a deadline and if it's in the past
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    return deadlineDate < now;
  };

  if (loading) {
    return (
      <Layout title="Sponsorship Opportunity Details">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsorship-opportunities" className="mr-4">
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
            <Link href="/sponsorship-opportunities" className="mr-4">
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
              <Link href="/sponsorship-opportunities">
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
            <Link href="/sponsorship-opportunities" className="mr-4">
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
              </div>
            </div>
          </div>
          <div>
            {!session && !isDeadlinePassed(opportunity.deadline) && (
              <Link href={`/auth/signin?callbackUrl=/sponsor/opportunities/${opportunity.id}/apply`}>
                <Button className="flex items-center">
                  Sign in to Apply
                  <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

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
          </CardFooter>
        </Card>

        {!session && !isDeadlinePassed(opportunity.deadline) && (
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 text-lg mb-1">Interested in this opportunity?</h3>
                  <p className="text-blue-700">
                    Sign in or create a sponsor account to apply for this sponsorship opportunity.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href={`/auth/signin?callbackUrl=/sponsor/opportunities/${opportunity.id}/apply`}>
                  <Button variant="default" className="min-w-[120px] flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href={`/auth/signup?role=SPONSOR&callbackUrl=/sponsor/opportunities/${opportunity.id}/apply`}>
                  <Button variant="outline" className="min-w-[150px]">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 