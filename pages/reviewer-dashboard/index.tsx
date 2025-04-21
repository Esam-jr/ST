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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

// Define types
type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

interface ReviewAssignment {
  id: string;
  status: ReviewStatus;
  assignedAt: string;
  dueDate: string;
  completedAt?: string;
  application: {
    id: string;
    startupName: string;
    industry: string;
    stage: string;
    status: string;
    submittedAt: string;
    call: {
      id: string;
      title: string;
    }
  };
}

export default function ReviewerDashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState('pending');
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Redirect if not authenticated or not reviewer
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (sessionStatus === 'unauthenticated') {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the reviewer dashboard",
        variant: "default",
      });
      router.push('/auth/signin?callbackUrl=/reviewer-dashboard');
      return;
    }
    
    if (session?.user?.role !== 'REVIEWER') {
      toast({
        title: "Access Denied",
        description: "Only reviewers can access this dashboard",
        variant: "destructive",
      });
      router.push('/dashboard');
      return;
    }
  }, [sessionStatus, session, router, toast]);

  // Fetch review assignments
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || session?.user?.role !== 'REVIEWER') return;
    
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        // This endpoint needs to be created
        const response = await axios.get('/api/reviewer/assignments');
        setAssignments(response.data);
      } catch (error) {
        console.error('Error fetching review assignments:', error);
        toast({
          title: "Error",
          description: "Failed to load review assignments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [sessionStatus, session, toast]);

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50">Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-50 text-green-600 hover:bg-green-50">Completed</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-50">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const startReview = async (assignmentId: string) => {
    try {
      // This endpoint needs to be created
      await axios.post(`/api/reviewer/assignments/${assignmentId}/start`);
      
      // Update the local state
      setAssignments(assignments.map(assignment => {
        if (assignment.id === assignmentId) {
          return {
            ...assignment,
            status: 'IN_PROGRESS' as ReviewStatus
          };
        }
        return assignment;
      }));
      
      // Redirect to the review page
      router.push(`/reviewer/review/${assignmentId}`);
    } catch (error) {
      console.error('Error starting review:', error);
      toast({
        title: "Error",
        description: "Failed to start the review process",
        variant: "destructive",
      });
    }
  };

  // Filter assignments based on the active tab
  const filteredAssignments = assignments.filter(assignment => {
    if (activeTab === 'pending') {
      return ['PENDING', 'IN_PROGRESS'].includes(assignment.status);
    } else if (activeTab === 'completed') {
      return assignment.status === 'COMPLETED';
    } else if (activeTab === 'overdue') {
      return assignment.status === 'OVERDUE';
    }
    return true;
  });

  if (loading) {
    return (
      <Layout title="Reviewer Dashboard | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reviewer Dashboard">
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight">Reviewer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and complete your assigned application reviews
            </p>
          </div>
        </header>
        
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList>
              <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {assignments.filter(a => ['PENDING', 'IN_PROGRESS'].includes(a.status)).length}
                      </div>
                      <p className="text-xs text-muted-foreground">Pending Reviews</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {assignments.filter(a => a.status === 'COMPLETED').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Completed Reviews</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {assignments.filter(a => a.status === 'OVERDUE').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Overdue Reviews</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Assignments List */}
              {filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No Reviews Found</h3>
                    <p className="mt-2 text-muted-foreground max-w-md">
                      {activeTab === 'pending' 
                        ? "You don't have any pending reviews at the moment." 
                        : activeTab === 'completed'
                        ? "You haven't completed any reviews yet."
                        : "You don't have any overdue reviews."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-xl">{assignment.application.startupName}</CardTitle>
                            <CardDescription className="mt-1">
                              {assignment.application.industry} • {assignment.application.stage}
                            </CardDescription>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(assignment.status)}
                            <span className="text-xs text-muted-foreground">
                              Assigned: {formatDate(assignment.assignedAt)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Call:</h4>
                            <p className="mt-1">{assignment.application.call.title}</p>
                          </div>
                          
                          <div className="flex items-center">
                            {assignment.dueDate && (
                              <div className={`
                                flex items-center
                                ${getDaysLeft(assignment.dueDate) <= 0 
                                  ? 'text-red-600' 
                                  : getDaysLeft(assignment.dueDate) <= 2 
                                  ? 'text-amber-600' 
                                  : 'text-muted-foreground'}
                              `}>
                                <Clock className="h-4 w-4 mr-1" />
                                {getDaysLeft(assignment.dueDate) <= 0 
                                  ? 'Overdue!' 
                                  : `Due in ${getDaysLeft(assignment.dueDate)} day${getDaysLeft(assignment.dueDate) !== 1 ? 's' : ''}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-2">
                        <Button 
                          variant={assignment.status === 'COMPLETED' ? 'outline' : 'default'}
                          className="ml-auto"
                          onClick={() => {
                            if (assignment.status === 'COMPLETED') {
                              router.push(`/reviewer/review/${assignment.id}?view=true`);
                            } else {
                              startReview(assignment.id);
                            }
                          }}
                        >
                          {assignment.status === 'COMPLETED' 
                            ? (
                              <>
                                View Review
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </>
                            ) 
                            : (
                              <>
                                {assignment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'} Review
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </>
                            )
                          }
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}