import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

// Define types
type StartupCallStatus = 'draft' | 'published' | 'closed' | 'archived';
type ApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: StartupCallStatus;
  applicationDeadline: Date;
  publishedDate: Date;
  applicationsCount: number;
}

interface Application {
  id: string;
  callId: string;
  callTitle: string;
  startupName: string;
  founderName: string;
  submittedDate: Date;
  status: ApplicationStatus;
  reviewsCompleted: number;
  reviewsTotal: number;
}

const AdminStartupCalls = () => {
  const [activeTab, setActiveTab] = useState('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock data for startup calls
  const startupCalls: StartupCall[] = [
    {
      id: 'call-001',
      title: 'Tech Innovation Challenge 2023',
      description: 'Seeking innovative tech startups with sustainable solutions.',
      status: 'published',
      applicationDeadline: new Date(2023, 6, 30),
      publishedDate: new Date(2023, 4, 15),
      applicationsCount: 24,
    },
    {
      id: 'call-002',
      title: 'Healthcare Startups Program',
      description: 'Supporting startups addressing healthcare challenges.',
      status: 'published',
      applicationDeadline: new Date(2023, 7, 15),
      publishedDate: new Date(2023, 5, 1),
      applicationsCount: 12,
    },
    {
      id: 'call-003',
      title: 'Green Energy Initiative',
      description: 'Funding for startups working on renewable energy solutions.',
      status: 'draft',
      applicationDeadline: new Date(2023, 8, 10),
      publishedDate: new Date(2023, 5, 15),
      applicationsCount: 0,
    },
    {
      id: 'call-004',
      title: 'Fintech Innovation Program',
      description: 'Accelerating financial technology startups.',
      status: 'closed',
      applicationDeadline: new Date(2023, 3, 30),
      publishedDate: new Date(2023, 2, 1),
      applicationsCount: 36,
    },
    {
      id: 'call-005',
      title: 'EdTech Accelerator',
      description: 'Supporting education technology startups.',
      status: 'archived',
      applicationDeadline: new Date(2023, 1, 28),
      publishedDate: new Date(2023, 0, 10),
      applicationsCount: 28,
    },
  ];
  
  // Mock data for applications
  const applications: Application[] = [
    {
      id: 'app-001',
      callId: 'call-001',
      callTitle: 'Tech Innovation Challenge 2023',
      startupName: 'EcoSolutions',
      founderName: 'Jane Smith',
      submittedDate: new Date(2023, 5, 10),
      status: 'under_review',
      reviewsCompleted: 2,
      reviewsTotal: 3,
    },
    {
      id: 'app-002',
      callId: 'call-001',
      callTitle: 'Tech Innovation Challenge 2023',
      startupName: 'CloudSecure',
      founderName: 'Michael Johnson',
      submittedDate: new Date(2023, 5, 12),
      status: 'submitted',
      reviewsCompleted: 0,
      reviewsTotal: 3,
    },
    {
      id: 'app-003',
      callId: 'call-002',
      callTitle: 'Healthcare Startups Program',
      startupName: 'MediTech Pro',
      founderName: 'Samantha Williams',
      submittedDate: new Date(2023, 5, 15),
      status: 'approved',
      reviewsCompleted: 3,
      reviewsTotal: 3,
    },
    {
      id: 'app-004',
      callId: 'call-002',
      callTitle: 'Healthcare Startups Program',
      startupName: 'DiagnosticAI',
      founderName: 'David Chen',
      submittedDate: new Date(2023, 5, 18),
      status: 'rejected',
      reviewsCompleted: 3,
      reviewsTotal: 3,
    },
    {
      id: 'app-005',
      callId: 'call-004',
      callTitle: 'Fintech Innovation Program',
      startupName: 'PaySmart',
      founderName: 'Alex Rodriguez',
      submittedDate: new Date(2023, 3, 20),
      status: 'withdrawn',
      reviewsCompleted: 1,
      reviewsTotal: 3,
    },
  ];

  // Filter functions
  const filteredCalls = startupCalls.filter(call => {
    const matchesQuery = call.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && call.status === statusFilter;
  });

  const filteredApplications = applications.filter(app => {
    const matchesQuery = app.startupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.callTitle.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && app.status === statusFilter;
  });

  // Helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: StartupCallStatus | ApplicationStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-muted text-muted-foreground hover:bg-muted">Draft</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Published</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Closed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Archived</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 hover:bg-purple-50">Under Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Calculate statistics
  const callStats = {
    total: startupCalls.length,
    published: startupCalls.filter(call => call.status === 'published').length,
    closed: startupCalls.filter(call => call.status === 'closed').length,
    draft: startupCalls.filter(call => call.status === 'draft').length,
    archived: startupCalls.filter(call => call.status === 'archived').length,
  };

  const applicationStats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'submitted').length,
    underReview: applications.filter(app => app.status === 'under_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Startup Calls Management</CardTitle>
          <CardDescription>
            Create and manage startup calls and review applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="calls">Calls</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>
              
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>{activeTab === 'calls' ? 'Create Call' : 'Add Application'}</span>
              </Button>
            </div>
            
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              {activeTab === 'calls' ? (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{callStats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Calls</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{callStats.published}</div>
                        <p className="text-xs text-muted-foreground">Published</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{callStats.closed}</div>
                        <p className="text-xs text-muted-foreground">Closed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">{callStats.draft}</div>
                        <p className="text-xs text-muted-foreground">Draft</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{applicationStats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Applications</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{applicationStats.submitted + applicationStats.underReview}</div>
                        <p className="text-xs text-muted-foreground">In Process</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{applicationStats.approved}</div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{applicationStats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-[280px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab === 'calls' ? 'calls' : 'applications'}...`}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Filter</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {activeTab === 'calls' ? (
                    <>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value="calls" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.title}</TableCell>
                          <TableCell>{getStatusBadge(call.status)}</TableCell>
                          <TableCell>{call.applicationsCount}</TableCell>
                          <TableCell>{formatDate(call.publishedDate)}</TableCell>
                          <TableCell>{formatDate(call.applicationDeadline)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Startup</TableHead>
                        <TableHead>Call</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.startupName}</TableCell>
                          <TableCell>{app.callTitle}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{app.reviewsCompleted}/{app.reviewsTotal}</span>
                              {app.reviewsCompleted === app.reviewsTotal ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : app.reviewsCompleted === 0 ? (
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(app.submittedDate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Reviews</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <div className="text-sm text-muted-foreground">
            Showing {activeTab === 'calls' ? filteredCalls.length : filteredApplications.length} of {activeTab === 'calls' ? startupCalls.length : applications.length} {activeTab}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminStartupCalls; 