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
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  CheckCircle,
  Download,
  Building,
  Globe,
  Users,
  Calendar as CalendarIcon,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

// Define types
type CallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

interface StartupCallApplication {
  id: string;
  callId: string;
  callTitle: string;
  submittedAt: string;
  status: ApplicationStatus;
  
  // Startup information
  startupName: string;
  website?: string;
  foundingDate: string;
  teamSize: string;
  industry: string;
  stage: string;
  description: string;
  
  // Application details
  problem: string;
  solution: string;
  traction?: string;
  businessModel: string;
  funding?: string;
  useOfFunds: string;
  competitiveAdvantage: string;
  founderBio: string;
  
  // Files
  pitchDeckUrl?: string;
  financialsUrl?: string;
  
  // Review information
  reviewsCompleted: number;
  reviewsTotal: number;
}

export default function ApplicationDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<StartupCallApplication | null>(null);
  const { toast } = useToast();

  // Fetch the application data
  useEffect(() => {
    if (!id || sessionStatus === 'loading') return;
    
    // Redirect if not authenticated
    if (sessionStatus === 'unauthenticated') {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your application",
        variant: "default",
      });
      router.push(`/auth/signin?callbackUrl=/applications/${id}`);
      return;
    }
    
    // Only entrepreneurs can view applications
    if (session?.user?.role !== 'ENTREPRENEUR') {
      toast({
        title: "Access Denied",
        description: "Only entrepreneurs can view applications",
        variant: "destructive",
      });
      router.push('/dashboard');
      return;
    }
    
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/applications/${id}`);
        setApplication(response.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching application:', error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch application details",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, sessionStatus, session, router, toast]);

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-50">Submitted</Badge>;
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

  if (loading) {
    return (
      <Layout title="Application Details | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout title="Application Not Found">
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Application Not Found</h1>
          <p className="mt-2 text-muted-foreground">The application you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-6" onClick={() => router.push('/startup-calls')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startup Calls
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Application for ${application.callTitle}`}>
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
                  Back to startup calls
                </Button>
                
                <h1 className="text-2xl font-bold tracking-tight">Application for {application.callTitle}</h1>
                <p className="text-muted-foreground mt-1">
                  Submitted on {formatDate(application.submittedAt)}
                </p>
              </div>
              
              <div className="flex items-center">
                <span className="mr-2 text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(application.status)}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Application status card */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Submitted on {formatDate(application.submittedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Current status: {getStatusBadge(application.status)}</span>
                    </div>
                    
                    <div className="flex flex-col space-y-1 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Review progress</span>
                        <span className="font-medium">{application.reviewsCompleted} of {application.reviewsTotal} reviews</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(application.reviewsCompleted / application.reviewsTotal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/startup-calls/${application.callId}`)}
                    >
                      View Call Details
                    </Button>
                    {application.status === 'SUBMITTED' && (
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          // In a real app, this would call an API to withdraw the application
                          toast({
                            title: "Not Implemented",
                            description: "Withdrawing applications is not implemented in this demo.",
                            variant: "default",
                          });
                        }}
                      >
                        Withdraw Application
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submitted Application Content */}
            <Card>
              <CardHeader>
                <CardTitle>Startup Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Startup Name</h3>
                    <p className="mt-1">{application.startupName}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                    <p className="mt-1">
                      <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {application.website}
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Founding Date</h3>
                    <p className="mt-1">{formatDate(application.foundingDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Team Size</h3>
                    <p className="mt-1">{application.teamSize} members</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Stage</h3>
                    <p className="mt-1">{application.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{application.description}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Product and Market</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Problem Statement</h3>
                  <p className="mt-1">{application.problem}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Solution</h3>
                  <p className="mt-1">{application.solution}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Traction</h3>
                  <p className="mt-1">{application.traction}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Business Model</h3>
                  <p className="mt-1">{application.businessModel}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Competitive Advantage</h3>
                  <p className="mt-1">{application.competitiveAdvantage}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Funding and Financials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Previous Funding</h3>
                  <p className="mt-1">{application.funding}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Use of Funds</h3>
                  <p className="mt-1">{application.useOfFunds}</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Pitch Deck</h3>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(application.pitchDeckUrl, '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Pitch Deck
                      </Button>
                    </div>
                  </div>
                  
                  {application.financialsUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Financial Projections</h3>
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(application.financialsUrl, '_blank')}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Financials
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Founder Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Founder Bio</h3>
                  <p className="mt-1">{application.founderBio}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => router.push('/startup-calls')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Calls
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/startup-calls?tab=myapplications')}
              >
                View All My Applications
              </Button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 