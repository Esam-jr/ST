import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
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

// Define types
type CallStatus = 'draft' | 'published' | 'closed' | 'archived';
type ApplicationStatus = 'not_applied' | 'applied' | 'under_review' | 'approved' | 'rejected';

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: CallStatus;
  applicationDeadline: Date;
  publishedDate: Date;
  industry: string;
  location: string;
  fundingAmount?: string;
  requirements: string[];
  applicationStatus?: ApplicationStatus;
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor: string;
  applicationProcess: string;
}

export default function StartupCallDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState<StartupCall | null>(null);

  // Mock data fetching - In a real app, this would be an API call
  useEffect(() => {
    if (!id) return;

    // Simulate API call delay
    const timer = setTimeout(() => {
      // This would be replaced with a real API call in production
      const mockCall: StartupCall = {
        id: 'call-001',
        title: 'Tech Innovation Challenge 2023',
        description: 'We are seeking innovative technology startups that have developed solutions addressing environmental sustainability. Selected startups will receive funding, mentorship, and access to our network of industry experts. The program runs for 6 months and includes regular check-ins with mentors, workshops, and networking events.',
        status: 'published',
        applicationDeadline: new Date(2023, 6, 30),
        publishedDate: new Date(2023, 4, 15),
        industry: 'Technology',
        location: 'Global',
        fundingAmount: '$50,000 - $100,000',
        requirements: ['MVP ready', 'Less than 3 years old', 'Sustainability focus'],
        applicationStatus: 'not_applied',
        eligibilityCriteria: [
          'Startups must be legally registered entities',
          'Founding team must have at least 2 members',
          'Must have a working prototype or MVP',
          'Product or service must address environmental sustainability',
          'No more than 3 years since incorporation',
          'Must be able to demonstrate some market validation'
        ],
        selectionProcess: [
          'Initial application screening',
          'Technical assessment of product/solution',
          'Panel interview with industry experts',
          'Final selection by investment committee'
        ],
        aboutSponsor: 'This program is sponsored by GreenTech Ventures, a leading venture capital firm specializing in sustainable technology investments. Since 2015, GreenTech Ventures has invested in over 50 startups across the globe, with a focus on solutions that address climate change, resource efficiency, and environmental protection.',
        applicationProcess: 'Applications open until July 30, 2023. Shortlisted startups will be contacted within 2 weeks of the deadline. The selected cohort will be announced by August 31, 2023, with the program starting in September 2023.'
      };
      
      setCall(mockCall);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  // Redirect if not authenticated or not an entrepreneur
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/startup-calls/${id}`);
    } else if (status === 'authenticated' && session?.user?.role !== 'ENTREPRENEUR') {
      router.push('/dashboard');
    }
  }, [status, session, router, id]);

  // Helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline: Date) => {
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (status === 'loading' || loading) {
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
  const hasApplied = call.applicationStatus !== 'not_applied';

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
                </p>
              </div>
              
              <div className="flex gap-2">
                {!isExpired && call.applicationStatus === 'not_applied' ? (
                  <Button onClick={() => router.push(`/startup-calls/${call.id}/apply`)}>
                    Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : hasApplied ? (
                  <Button onClick={() => router.push(`/applications/${call.id}`)}>
                    View My Application
                  </Button>
                ) : null}
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
                        <p className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                          {isExpired ? 'Applications closed' : `${daysLeft} days left`}
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
                    
                    <div className="flex items-start">
                      <FileText className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Application Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {call.applicationStatus === 'not_applied' 
                            ? 'You have not applied yet' 
                            : `Your application is ${call.applicationStatus.replace('_', ' ')}`}
                        </p>
                      </div>
                    </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">About the Sponsor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{call.aboutSponsor}</p>
              </CardContent>
            </Card>
            
            {/* Application Process */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Application Process</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{call.applicationProcess}</p>
              </CardContent>
              <CardFooter className="flex justify-end pt-0">
                {!isExpired && call.applicationStatus === 'not_applied' ? (
                  <Button onClick={() => router.push(`/startup-calls/${call.id}/apply`)}>
                    Apply Now <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : hasApplied ? (
                  <Button onClick={() => router.push(`/applications/${call.id}`)}>
                    View My Application
                  </Button>
                ) : (
                  <Button disabled>Applications Closed</Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
} 