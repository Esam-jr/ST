import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Calendar, 
  Eye, 
  ArrowUpDown,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Archive
} from 'lucide-react';
import StartupCallForm from './StartupCallForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

// Define types
type StartupCallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: StartupCallStatus;
  applicationDeadline: Date | string;
  publishedDate: Date | string | null;
  createdAt: Date | string;
  industry: string;
  location: string;
  fundingAmount?: string | null;
  requirements: string[];
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor?: string | null;
  applicationProcess: string;
  _count?: {
    applications: number;
  };
}

interface Application {
  id: string;
  callId: string;
  callTitle?: string;
  startupName: string;
  status: ApplicationStatus;
  submittedAt: Date | string;
  user: {
    name: string;
    email: string;
  };
  reviewsCompleted: number;
  reviewsTotal: number;
  pitchDeckUrl?: string;
}

const AdminStartupCalls = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Form management state
  const [showForm, setShowForm] = useState(false);
  const [selectedCall, setSelectedCall] = useState<StartupCall | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [callToDelete, setCallToDelete] = useState<string | null>(null);

  const router = useRouter();

  // Fetch startup calls
  const fetchStartupCalls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/startup-calls');
      setStartupCalls(response.data);
    } catch (error) {
      console.error('Error fetching startup calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch startup calls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications for a specific call
  const fetchApplications = async (callId: string) => {
    try {
      const response = await axios.get(`/api/startup-calls/${callId}/applications`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching applications for call ${callId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: StartupCall & { createdAt?: Date | string }) => {
    setFormSubmitting(true);
    try {
      if (selectedCall?.id) {
        // Update existing call
        await axios.put(`/api/startup-calls/${selectedCall.id}`, data);
        toast({
          title: 'Success',
          description: 'Startup call updated successfully',
        });
      } else {
        // Create new call
        await axios.post('/api/startup-calls', data);
        toast({
          title: 'Success',
          description: 'Startup call created successfully',
        });
      }
      
      // Close form and refresh data
      setShowForm(false);
      setSelectedCall(null);
      fetchStartupCalls();
    } catch (error) {
      console.error('Error saving startup call:', error);
      toast({
        title: 'Error',
        description: 'Failed to save startup call',
        variant: 'destructive',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle call deletion
  const handleDelete = async () => {
    if (!callToDelete) return;
    
    try {
      await axios.delete(`/api/startup-calls/${callToDelete}`);
      toast({
        title: 'Success',
        description: 'Startup call deleted successfully',
      });
      fetchStartupCalls();
    } catch (error: any) {
      console.error('Error deleting startup call:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete startup call',
        variant: 'destructive',
      });
    } finally {
      setCallToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchStartupCalls();
  }, []);

  // Fetch applications for the selected call when tab changes
  useEffect(() => {
    if (activeTab === 'applications') {
      const loadApplications = async () => {
        setLoading(true);
        try {
          const allApplications: Application[] = [];
          
          // For each call, fetch its applications
          for (const call of startupCalls) {
            try {
              const callApplications = await fetchApplications(call.id);
              if (callApplications && callApplications.length > 0) {
                // Add the call title to each application for easy reference
                const applicationsWithCallTitle = callApplications.map(app => ({
                  ...app,
                  callTitle: call.title
                }));
                allApplications.push(...applicationsWithCallTitle);
              }
            } catch (err) {
              console.error(`Error fetching applications for call ${call.id}:`, err);
            }
          }
          
          setApplications(allApplications);
        } catch (err) {
          console.error('Error loading applications:', err);
          toast({
            title: 'Error',
            description: 'Failed to load applications',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadApplications();
    }
  }, [activeTab, startupCalls]);

  // Filter functions
  const filteredCalls = startupCalls.filter(call => {
    const matchesQuery = call.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && call.status === statusFilter;
  });

  const filteredApplications = applications.filter(app => {
    const matchesQuery = app.startupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && app.status === statusFilter;
  });

  // Helper functions
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: StartupCallStatus | ApplicationStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-muted text-muted-foreground hover:bg-muted">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Published</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Closed</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Archived</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 hover:bg-purple-50">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDaysLeft = (deadline: Date | string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate statistics
  const callStats = {
    total: startupCalls.length,
    published: startupCalls.filter(call => call.status === 'PUBLISHED').length,
    closed: startupCalls.filter(call => call.status === 'CLOSED').length,
    draft: startupCalls.filter(call => call.status === 'DRAFT').length,
    archived: startupCalls.filter(call => call.status === 'ARCHIVED').length,
  };

  const applicationStats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'SUBMITTED').length,
    underReview: applications.filter(app => app.status === 'UNDER_REVIEW').length,
    approved: applications.filter(app => app.status === 'APPROVED').length,
    rejected: applications.filter(app => app.status === 'REJECTED').length,
    withdrawn: applications.filter(app => app.status === 'WITHDRAWN').length,
  };

  // Open form with empty data for new call
  const handleCreateNewCall = () => {
    setSelectedCall(null);
    setShowForm(true);
  };

  // Open form with existing data for editing
  const handleEditCall = (call: StartupCall) => {
    setSelectedCall(call);
    setShowForm(true);
  };

  // Confirm dialog for deleting a call
  const handleDeleteClick = (callId: string) => {
    setCallToDelete(callId);
    setDeleteConfirmOpen(true);
  };

  // Update status directly
  const handleStatusChange = async (callId: string, newStatus: StartupCallStatus) => {
    try {
      const call = startupCalls.find(c => c.id === callId);
      if (!call) return;
      
      await axios.put(`/api/startup-calls/${callId}`, {
        ...call,
        status: newStatus,
        // Ensure dates are properly formatted
        applicationDeadline: new Date(call.applicationDeadline).toISOString(),
        publishedDate: call.publishedDate ? new Date(call.publishedDate).toISOString() : null
      });
      
      toast({
        title: 'Success',
        description: `Startup call status updated to ${newStatus.toLowerCase()}`,
      });
      
      fetchStartupCalls();
    } catch (error) {
      console.error('Error updating startup call status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update startup call status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Startup Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {callStats.published} published, {callStats.draft} drafts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{callStats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Open for applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Closed Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{callStats.closed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applications no longer accepted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {applicationStats.approved} approved, {applicationStats.underReview} under review
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList>
              <TabsTrigger value="calls">Startup Calls</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleCreateNewCall}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Startup Call
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'calls' ? 'startup calls' : 'applications'}...`}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {activeTab === 'calls' ? (
                  <>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Startup Calls Tab Content */}
      <TabsContent value="calls" className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading startup calls...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-muted p-3">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No startup calls found</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by creating a new startup call'}
                        </p>
                        {!(searchQuery || statusFilter !== 'all') && (
                          <Button onClick={handleCreateNewCall} className="mt-4">
                            <Plus className="mr-1.5 h-4 w-4" />
                            New Startup Call
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="font-medium">{call.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {call.description}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>{call.industry}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatDate(call.applicationDeadline)}</div>
                        {call.status === 'PUBLISHED' && (
                          <div className={`text-xs ${
                            getDaysLeft(call.applicationDeadline) <= 0 
                              ? 'text-red-500' 
                              : getDaysLeft(call.applicationDeadline) < 7 
                                ? 'text-amber-500' 
                                : 'text-muted-foreground'
                          }`}>
                            {getDaysLeft(call.applicationDeadline) <= 0 
                              ? 'Expired' 
                              : `${getDaysLeft(call.applicationDeadline)} days left`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {call._count?.applications || 0} total
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCall(call)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {call.status === 'DRAFT' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleStatusChange(call.id, 'PUBLISHED')}
                              title="Publish"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="sr-only">Publish</span>
                            </Button>
                          )}
                          {call.status === 'PUBLISHED' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleStatusChange(call.id, 'CLOSED')}
                              title="Close"
                            >
                              <XCircle className="h-4 w-4 text-amber-600" />
                              <span className="sr-only">Close</span>
                            </Button>
                          )}
                          {call.status !== 'ARCHIVED' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleStatusChange(call.id, 'ARCHIVED')}
                              title="Archive"
                            >
                              <Archive className="h-4 w-4 text-slate-600" />
                              <span className="sr-only">Archive</span>
                            </Button>
                          )}
                          {call._count?.applications === 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteClick(call.id)}
                              className="text-red-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {filteredCalls.length} of {startupCalls.length} startup calls
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Applications Tab Content */}
      <TabsContent value="applications" className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Call</TableHead>
                  <TableHead>Founder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading applications...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-muted p-3">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search criteria or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.startupName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{app.callTitle || 'Unknown Call'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{app.user.name}</div>
                        <div className="text-xs text-muted-foreground">{app.user.email}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatDate(app.submittedAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {app.reviewsCompleted}/{app.reviewsTotal}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/admin/startup-calls/${app.callId}/applications/${app.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          {app.pitchDeckUrl && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => window.open(app.pitchDeckUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download Pitch Deck</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Create/Edit Form Dialog */}
      {showForm && (
        <StartupCallForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedCall(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={selectedCall}
          isSubmitting={formSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the startup call.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStartupCalls; 