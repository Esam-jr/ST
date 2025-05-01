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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Edit, 
  DollarSign, 
  Calendar, 
  Check, 
  X,
  MessageCircle,
  Clock,
  ExternalLink
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
  updatedAt: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
  _count?: {
    applications: number;
  };
}

interface SponsorshipApplication {
  id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  createdAt: string;
  sponsor: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SponsorshipOpportunityDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(null);
  const [applications, setApplications] = useState<SponsorshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + router.asPath);
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
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
      
      // Fetch applications for this opportunity
      const applicationsResponse = await axios.get(`/api/sponsorship-opportunities/${id}/applications`);
      setApplications(applicationsResponse.data);
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

  const handleStatusChange = async (status: string) => {
    try {
      setProcessingAction('status');
      await axios.patch(`/api/sponsorship-opportunities/${id}`, { status });
      
      setOpportunity(prev => prev ? { ...prev, status } : null);
      
      toast({
        title: 'Success',
        description: `Opportunity status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update opportunity status',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApplicationStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      setProcessingAction(applicationId);
      
      await axios.patch(`/api/sponsorship-applications/${applicationId}`, {
        status: newStatus
      });
      
      // Update local state
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus } 
            : app
        )
      );
      
      toast({
        title: 'Success',
        description: `Application ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Closed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout title="Sponsorship Opportunity Details">
        <div className="container mx-auto py-8">
          <div className="flex items-center mb-6">
            <Link href="/admin/sponsorship-opportunities" className="mr-4">
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
        <div className="container mx-auto py-8">
          <div className="flex items-center mb-6">
            <Link href="/admin/sponsorship-opportunities" className="mr-4">
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
              <Link href="/admin/sponsorship-opportunities">
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
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin/sponsorship-opportunities" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{opportunity.title}</h1>
            <div className="flex items-center mt-2">
              <span className="mr-2">Status:</span>
              {getStatusBadge(opportunity.status)}
            </div>
          </div>
          <div className="ml-auto space-x-2">
            <Link href={`/admin/sponsorship-opportunities/edit/${opportunity.id}`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>

            {opportunity.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('active')}
                disabled={processingAction === 'status'}
              >
                {processingAction === 'status' ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  <span>Publish</span>
                )}
              </Button>
            )}
            
            {opportunity.status === 'active' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusChange('closed')}
                disabled={processingAction === 'status'}
              >
                {processingAction === 'status' ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  <span>Close</span>
                )}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="applications" className="relative">
              Applications
              {applications.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {applications.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
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
                    <h3 className="text-lg font-medium mb-2">Created</h3>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span>{formatDate(opportunity.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {opportunity.startupCall && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Associated Startup Call</h3>
                      <Link 
                        href={`/admin/startup-calls/${opportunity.startupCallId}`}
                        className="text-primary hover:underline flex items-center"
                      >
                        {opportunity.startupCall.title}
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </>
                )}

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
                    <p className="text-gray-500 italic">No benefits specified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sponsorship Applications</CardTitle>
                <CardDescription>
                  Review and manage applications from sponsors interested in this opportunity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applications have been submitted yet.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sponsor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{application.sponsor.name}</div>
                                <div className="text-sm text-gray-500">{application.sponsor.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(application.amount, application.currency)}
                            </TableCell>
                            <TableCell>{getStatusBadge(application.status)}</TableCell>
                            <TableCell>{formatDate(application.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Link href={`/admin/sponsorship-applications/${application.id}`}>
                                  <Button variant="outline" size="sm" className="h-8">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                </Link>
                                
                                {application.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-8"
                                      onClick={() => handleApplicationStatusChange(application.id, 'approved')}
                                      disabled={processingAction === application.id}
                                    >
                                      {processingAction === application.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-green-700 rounded-full"></div>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Approve
                                        </>
                                      )}
                                    </Button>
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 h-8"
                                      onClick={() => handleApplicationStatusChange(application.id, 'rejected')}
                                      disabled={processingAction === application.id}
                                    >
                                      {processingAction === application.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-red-700 rounded-full"></div>
                                      ) : (
                                        <>
                                          <X className="h-4 w-4 mr-1" />
                                          Reject
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 