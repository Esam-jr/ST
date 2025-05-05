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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Link from 'next/link';

// Define types
interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  sponsorId: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  opportunity: {
    id: string;
    title: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    currency: string;
    deadline: string | null;
  };
}

export default function MySponsorshipApplicationsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [applications, setApplications] = useState<SponsorshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if (session.user?.role !== 'SPONSOR') {
        toast({
          title: 'Access Denied',
          description: 'Only sponsors can view applications.',
          variant: 'destructive',
        });
        router.push('/');
      } else {
        fetchApplications();
      }
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/signin?callbackUrl=/sponsorship-applications');
    }
  }, [sessionStatus, session]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/applications/my-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your applications. Please try again later.',
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

  // Get status badge variant based on application status
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return { variant: 'success' as const, icon: <CheckCircle className="h-4 w-4 mr-1" /> };
      case 'REJECTED':
        return { variant: 'destructive' as const, icon: <XCircle className="h-4 w-4 mr-1" /> };
      case 'PENDING':
        return { variant: 'outline' as const, icon: <Clock className="h-4 w-4 mr-1" /> };
      default:
        return { variant: 'secondary' as const, icon: <AlertCircle className="h-4 w-4 mr-1" /> };
    }
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && loading)) {
    return (
      <Layout title="My Sponsorship Applications">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Sponsorship Applications">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Sponsorship Applications</h1>
              <p className="text-gray-600 mt-1">
                Track the status of your sponsorship applications
              </p>
            </div>
            <Link href="/sponsorship-opportunities">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                View Opportunities
              </Button>
            </Link>
          </div>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-2">You haven't submitted any sponsorship applications yet.</p>
              <Link href="/sponsorship-opportunities">
                <Button variant="default" className="mt-4">
                  Browse Opportunities
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((application) => {
              const { variant, icon } = getStatusBadge(application.status);
              
              return (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <CardTitle className="text-xl truncate">{application.opportunity.title}</CardTitle>
                      <Badge variant={variant} className="flex items-center">
                        {icon}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Applied on {new Date(application.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Amount</p>
                          <p className="text-gray-600">{formatCurrency(application.amount, application.currency)}</p>
                        </div>
                      </div>
                      
                      {application.opportunity.deadline && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Opportunity Deadline</p>
                            <p className="text-gray-600">{new Date(application.opportunity.deadline).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      
                      {application.message && (
                        <>
                          <Separator />
                          <div>
                            <p className="font-medium mb-1">Your Message</p>
                            <p className="text-gray-600">{application.message}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/sponsorship-opportunities/${application.opportunityId}`} passHref>
                      <Button variant="outline" className="w-full">View Opportunity</Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
} 