import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Filter, 
  Search,
  FileText,
  Eye,
  ChevronDown,
  ChevronRight,
  Star,
  Send,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ApplicationReviewDetails from './ApplicationReviewDetails';
import MassNotificationSender from './MassNotificationSender';

// Define types
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'WITHDRAWN';
type StartupCallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

interface ApplicationReview {
  id: string;
  score: number | null;
  innovationScore: number | null;
  marketScore: number | null;
  teamScore: number | null;
  executionScore: number | null;
  feedback: string | null;
  status: ReviewStatus;
  assignedAt: string;
  completedAt: string | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }
}

interface Application {
  id: string;
  startupName: string;
  industry: string;
  stage: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewsCompleted: number;
  reviewsTotal: number;
  reviews: ApplicationReview[];
  averageScores: {
    overall: number;
    innovation: number;
    market: number;
    team: number;
    execution: number;
  };
  rank: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  }
}

interface StartupCall {
  id: string;
  title: string;
  status: StartupCallStatus;
  industry: string;
  applicationDeadline: string;
  applications: Application[];
}

const AdminReviews: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<StartupCall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedApplications, setExpandedApplications] = useState<string[]>([]);
  const [expandedCalls, setExpandedCalls] = useState<string[]>([]);
  
  // Status update dialog state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  // Fetch startup calls with applications and reviews
  useEffect(() => {
    fetchStartupCalls();
  }, []);

  const fetchStartupCalls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/reviews/startup-calls');
      setStartupCalls(response.data);
      
      // Expand first call by default if any exist
      if (response.data.length > 0) {
        setExpandedCalls([response.data[0].id]);
        setSelectedCall(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching startup calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch startup calls. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 hover:bg-yellow-50">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-50">Withdrawn</Badge>;
      case 'PUBLISHED':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Published</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 hover:bg-orange-50">Closed</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-50">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle expanding/collapsing applications
  const toggleApplicationExpansion = (applicationId: string) => {
    setExpandedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  // Handle expanding/collapsing calls
  const toggleCallExpansion = (call: StartupCall) => {
    setExpandedCalls(prev => 
      prev.includes(call.id)
        ? prev.filter(id => id !== call.id)
        : [...prev, call.id]
    );
    setSelectedCall(call);
  };

  // Handle status update
  const openUpdateDialog = (application: Application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setFeedbackMessage('');
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplication || !newStatus) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.put('/api/admin/applications/update-status', {
        applicationId: selectedApplication.id,
        status: newStatus,
        feedbackMessage
      });
      
      // Update local state
      setStartupCalls(prev => 
        prev.map(call => ({
          ...call,
          applications: call.applications.map(app => 
            app.id === selectedApplication.id
              ? { ...app, status: newStatus as ApplicationStatus }
              : app
          )
        }))
      );
      
      toast({
        title: 'Success',
        description: `Application status updated to ${newStatus.toLowerCase()}`,
      });
      
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter applications based on search query and status filter
  const getFilteredApplications = (applications: Application[]) => {
    return applications.filter(app => {
      const matchesQuery = app.startupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.industry.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === 'all') return matchesQuery;
      return matchesQuery && app.status === statusFilter;
    });
  };

  // Calculate statistics for selected call
  const getCallStats = (call: StartupCall | null) => {
    if (!call) return { total: 0, approved: 0, rejected: 0, underReview: 0, submitted: 0 };
    
    return {
      total: call.applications.length,
      approved: call.applications.filter(app => app.status === 'APPROVED').length,
      rejected: call.applications.filter(app => app.status === 'REJECTED').length,
      underReview: call.applications.filter(app => app.status === 'UNDER_REVIEW').length,
      submitted: call.applications.filter(app => app.status === 'SUBMITTED').length,
    };
  };

  // Add this function to handle application selection
  const handleApplicationSelect = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  // Add this function to handle successful notification sending
  const handleNotificationSuccess = () => {
    setSelectedApplications([]);
    // Refresh the applications list
    fetchStartupCalls();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const callStats = getCallStats(selectedCall);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Reviews</CardTitle>
          <CardDescription>
            Manage and review startup applications with rankings and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add the mass notification sender */}
          {selectedApplications.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedApplications.length} application{selectedApplications.length !== 1 ? 's' : ''} selected
              </div>
              <MassNotificationSender 
                selectedApplications={selectedApplications}
                onSuccess={handleNotificationSuccess}
              />
            </div>
          )}

          {startupCalls.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No startup calls found</h3>
              <p className="text-muted-foreground mt-2">There are no active startup calls to review.</p>
            </div>
          ) : (
            <>
              {/* Startup call selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Startup Calls</h3>
                  <div className="space-y-2">
                    {startupCalls.map(call => (
                      <div 
                        key={call.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCall?.id === call.id ? 'bg-muted/50 border-primary/50' : 'hover:bg-muted/20'
                        }`}
                        onClick={() => toggleCallExpansion(call)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedCalls.includes(call.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{call.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(call.status)}
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {call.applications.length} Applications
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Call statistics */}
                {selectedCall && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Call Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{callStats.total}</div>
                            <p className="text-xs text-muted-foreground">Total Applications</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{callStats.approved}</div>
                            <p className="text-xs text-muted-foreground">Approved</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{callStats.rejected}</div>
                            <p className="text-xs text-muted-foreground">Rejected</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{callStats.underReview + callStats.submitted}</div>
                            <p className="text-xs text-muted-foreground">Pending Decision</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              {selectedCall && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-[280px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applications..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>Filter</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Applications Table */}
              {selectedCall && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Startup</TableHead>
                        <TableHead className="hidden md:table-cell">Industry</TableHead>
                        <TableHead className="hidden md:table-cell">Stage</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Average Score</TableHead>
                        <TableHead className="text-center">Reviews</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredApplications(selectedCall.applications).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No applications found matching your criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredApplications(selectedCall.applications).map((app) => (
                          <React.Fragment key={app.id}>
                            <TableRow 
                              className={`cursor-pointer ${expandedApplications.includes(app.id) ? 'bg-muted/30' : ''}`}
                              onClick={() => toggleApplicationExpansion(app.id)}
                            >
                              <TableCell className="w-[50px]">
                                <input
                                  type="checkbox"
                                  checked={selectedApplications.includes(app.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleApplicationSelect(app.id);
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{app.startupName}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Submitted: {formatDate(app.submittedAt)}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{app.industry}</TableCell>
                              <TableCell className="hidden md:table-cell">{app.stage}</TableCell>
                              <TableCell className="text-center">{getStatusBadge(app.status)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center items-center">
                                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="font-medium">{app.averageScores.overall || 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={app.reviewsCompleted === app.reviewsTotal ? "default" : "outline"}>
                                  {app.reviewsCompleted}/{app.reviewsTotal}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    openUpdateDialog(app);
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  <span>Update</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded application details */}
                            {expandedApplications.includes(app.id) && (
                              <TableRow>
                                <TableCell colSpan={8} className="p-0 border-t-0">
                                  <div className="bg-muted/30 p-4">
                                    <ApplicationReviewDetails application={app} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedApplication?.startupName} and send a notification to the entrepreneur.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">Current Status</h4>
              <div>{selectedApplication && getStatusBadge(selectedApplication.status)}</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">New Status</h4>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">Feedback Message (Optional)</h4>
              <p className="text-xs text-muted-foreground">
                This message will be included in the notification sent to the entrepreneur.
              </p>
              <Textarea 
                placeholder="Enter feedback about the decision..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={!newStatus || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews; 