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
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Building,
  Globe,
  CreditCard,
  FileText,
  CheckCircle,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

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
  applicationStatus?: ApplicationStatus;
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor?: string;
  applicationProcess: string;
}

export default function StartupCallDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState<StartupCall | null>(null);
  const { toast } = useToast();

  // Fetch the startup call data from the API
  useEffect(() => {
    if (!id) return;
    
    const fetchStartupCall = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/startup-calls/${id}`);
        
        if (!response.data) {
          toast({
            title: "Startup call not found",
            description: "The requested startup call couldn't be found.",
            variant: "destructive",
          });
          setCall(null);
          return;
        }
        
        setCall(response.data);
      } catch (error: any) {
        console.error('Error fetching startup call:', error);
        
        // Check if this is a 404 or 403 error
        if (error.response?.status === 404) {
          toast({
            title: "Startup call not found",
            description: "The requested startup call doesn't exist or has been removed.",
            variant: "destructive",
          });
          setCall(null);
          return;
        } else if (error.response?.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this startup call.",
            variant: "destructive",
          });
          router.push('/startup-calls');
          return;
        } else {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to fetch startup call details. Please try again.",
            variant: "destructive",
          });
          router.push('/startup-calls');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStartupCall();
  }, [id, toast, router]);

  // No need to restrict access - anyone can view startup call details

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

  if (loading) {
    return (
      <Layout title="Startup Call Details | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!call) {
    return (
      <Layout title="Startup Call Not Found">
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Call Not Found</h1>
          <p className="mt-2 text-muted-foreground">The startup call you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => router.push('/startup-calls')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Calls
          </Button>
        </div>
      </Layout>
    );
  }

  const daysLeft = getDaysLeft(call.applicationDeadline);
  const isExpired = daysLeft <= 0;
  const isClosed = call.status === 'CLOSED';
  const canApply = !isExpired && !isClosed;
  const hasApplied = call.applicationStatus && call.applicationStatus !== 'NOT_APPLIED';
  const isEntrepreneur = session?.user?.role === 'ENTREPRENEUR';

  return (
    <Layout title={`${call.title} | Startup Call Details`}>
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-y-4 md:flex-row md:items-center">
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mb-2 -ml-2 text-sm text-muted-foreground"
                  onClick={() => router.push('/startup-calls')}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to all calls
                </Button>
                
                <h1 className="text-2xl font-bold tracking-tight">{call.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {call.industry} • {call.location}
                  {isClosed && (
                    <> • <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">CLOSED</span></>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2">
                {isEntrepreneur && (
                  <>
                    {canApply && (!call.applicationStatus || call.applicationStatus === 'NOT_APPLIED') ? (
                      <Button onClick={() => router.push(`/startup-calls/${call.id}/apply`)}>
                        Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    ) : hasApplied ? (
                      <Button onClick={() => router.push(`/applications/${call.id}`)}>
                        View My Application
                      </Button>
                    ) : null}
                  </>
                )}
                {!isEntrepreneur && !session && canApply && (
                  <Button onClick={() => router.push(`/auth/signin?callbackUrl=/startup-calls/${call.id}`)}>
                    Sign in to Apply
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Call Summary Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-lg font-medium">About This Call</h3>
                    <p className="text-muted-foreground">{call.description}</p>
                    
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Requirements</h4>
                      <div className="flex flex-wrap gap-2">
                        {call.requirements.map((req, index) => (
                          <Badge key={index} variant="outline">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5 rounded-lg bg-muted/20 p-4">
                    <div className="flex items-start">
                      <Calendar className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Application Deadline</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(call.applicationDeadline)}</p>
                        <p className={`text-sm font-medium ${isExpired || isClosed ? 'text-red-500' : 'text-amber-500'}`}>
                          {isClosed ? 'Call closed' : isExpired ? 'Applications closed' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Building className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Industry Focus</h4>
                        <p className="text-sm text-muted-foreground">{call.industry}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Globe className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Location</h4>
                        <p className="text-sm text-muted-foreground">{call.location}</p>
                      </div>
                    </div>
                    
                    {call.fundingAmount && (
                      <div className="flex items-start">
                        <CreditCard className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">Funding Available</h4>
                          <p className="text-sm text-muted-foreground">{call.fundingAmount}</p>
                        </div>
                      </div>
                    )}
                    
                    {session && isEntrepreneur && call.applicationStatus && (
                      <div className="flex items-start">
                        <FileText className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">Application Status</h4>
                          <p className="text-sm text-muted-foreground">
                            {call.applicationStatus === 'NOT_APPLIED' 
                              ? 'You have not applied yet' 
                              : `Your application is ${call.applicationStatus?.replace('_', ' ').toLowerCase() || ''}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Eligibility Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Eligibility Criteria</CardTitle>
                <CardDescription>
                  Startups must meet these requirements to be considered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="ml-2 space-y-3">
                  {call.eligibilityCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Selection Process */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Selection Process</CardTitle>
                <CardDescription>
                  How startups will be evaluated and selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="ml-5 list-decimal space-y-3">
                  {call.selectionProcess.map((step, index) => (
                    <li key={index} className="pl-1">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            
            {/* About Sponsor */}
            {call.aboutSponsor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">About the Sponsor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{call.aboutSponsor}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Application Process */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Application Process</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{call.applicationProcess}</p>
              </CardContent>
              <CardFooter className="flex justify-end pt-0">
                {isEntrepreneur ? (
                  <>
                    {canApply && (!call.applicationStatus || call.applicationStatus === 'NOT_APPLIED') ? (
                      <Button onClick={() => router.push(`/startup-calls/${call.id}/apply`)}>
                        Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    ) : hasApplied ? (
                      <Button onClick={() => router.push(`/applications/${call.id}`)}>
                        View My Application
                      </Button>
                    ) : (
                      <Button disabled>{isClosed ? 'Call Closed' : 'Applications Closed'}</Button>
                    )}
                  </>
                ) : !session && canApply ? (
                  <Button onClick={() => router.push(`/auth/signin?callbackUrl=/startup-calls/${call.id}`)}>
                    Sign in to Apply
                  </Button>
                ) : (
                  <Button disabled>{isClosed ? 'Call Closed' : 'Applications Closed'}</Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
} 