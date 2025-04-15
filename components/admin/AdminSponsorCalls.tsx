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
  Download,
  DollarSign,
  Building,
  Award,
  Briefcase,
  CircleCheck,
  CircleX,
  Clock
} from 'lucide-react';

// Define types
type SponsorCallStatus = 'draft' | 'published' | 'closed' | 'archived';
type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

interface SponsorCall {
  id: string;
  title: string;
  description: string;
  organization: string;
  status: SponsorCallStatus;
  fundingAmount: number;
  fundingType: string;
  category: string[];
  applicationDeadline: Date;
  publishedDate: Date;
  applicationsCount: number;
}

interface Application {
  id: string;
  callId: string;
  callTitle: string;
  startupName: string;
  requestedAmount: number;
  status: ApplicationStatus;
  submittedDate: Date;
  category: string;
}

const AdminSponsorCalls = () => {
  const [activeTab, setActiveTab] = useState('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for sponsor calls
  const sponsorCalls: SponsorCall[] = [
    {
      id: 'spc-001',
      title: 'Green Technology Funding Initiative',
      description: 'Funding for startups focused on sustainable energy solutions and green technologies.',
      organization: 'EcoVenture Capital',
      status: 'published',
      fundingAmount: 500000,
      fundingType: 'Equity',
      category: ['Sustainability', 'Energy', 'CleanTech'],
      applicationDeadline: new Date(2023, 7, 15),
      publishedDate: new Date(2023, 5, 1),
      applicationsCount: 12,
    },
    {
      id: 'spc-002',
      title: 'Healthcare Innovation Fund',
      description: 'Supporting startups developing innovative healthcare solutions and medical devices.',
      organization: 'MedTech Ventures',
      status: 'published',
      fundingAmount: 750000,
      fundingType: 'Equity + Grant',
      category: ['Healthcare', 'BioTech', 'MedTech'],
      applicationDeadline: new Date(2023, 8, 30),
      publishedDate: new Date(2023, 6, 15),
      applicationsCount: 8,
    },
    {
      id: 'spc-003',
      title: 'AI & Machine Learning Accelerator',
      description: 'Funding and mentorship for startups working in AI and machine learning.',
      organization: 'Tech Ventures Group',
      status: 'draft',
      fundingAmount: 300000,
      fundingType: 'Convertible Note',
      category: ['AI', 'Machine Learning', 'Data Science'],
      applicationDeadline: new Date(2023, 9, 15),
      publishedDate: new Date(2023, 7, 1),
      applicationsCount: 0,
    },
    {
      id: 'spc-004',
      title: 'Fintech Startup Fund',
      description: 'Investment in financial technology startups disrupting traditional banking and finance.',
      organization: 'FinCapital Partners',
      status: 'closed',
      fundingAmount: 600000,
      fundingType: 'Equity',
      category: ['FinTech', 'Blockchain', 'Banking'],
      applicationDeadline: new Date(2023, 4, 30),
      publishedDate: new Date(2023, 2, 1),
      applicationsCount: 15,
    },
    {
      id: 'spc-005',
      title: 'Education Technology Grant',
      description: 'Grants for startups improving education through technology.',
      organization: 'Future Education Foundation',
      status: 'archived',
      fundingAmount: 250000,
      fundingType: 'Grant',
      category: ['EdTech', 'Education', 'Learning'],
      applicationDeadline: new Date(2023, 1, 28),
      publishedDate: new Date(2022, 11, 10),
      applicationsCount: 22,
    },
  ];

  // Mock data for applications
  const applications: Application[] = [
    {
      id: 'spa-001',
      callId: 'spc-001',
      callTitle: 'Green Technology Funding Initiative',
      startupName: 'SolarPower Solutions',
      requestedAmount: 300000,
      status: 'pending',
      submittedDate: new Date(2023, 6, 5),
      category: 'Energy',
    },
    {
      id: 'spa-002',
      callId: 'spc-001',
      callTitle: 'Green Technology Funding Initiative',
      startupName: 'WasteRecycle Tech',
      requestedAmount: 250000,
      status: 'approved',
      submittedDate: new Date(2023, 6, 10),
      category: 'Sustainability',
    },
    {
      id: 'spa-003',
      callId: 'spc-002',
      callTitle: 'Healthcare Innovation Fund',
      startupName: 'MedDiagnostics AI',
      requestedAmount: 500000,
      status: 'pending',
      submittedDate: new Date(2023, 7, 3),
      category: 'Healthcare',
    },
    {
      id: 'spa-004',
      callId: 'spc-004',
      callTitle: 'Fintech Startup Fund',
      startupName: 'BlockPay Solutions',
      requestedAmount: 400000,
      status: 'rejected',
      submittedDate: new Date(2023, 3, 15),
      category: 'FinTech',
    },
    {
      id: 'spa-005',
      callId: 'spc-004',
      callTitle: 'Fintech Startup Fund',
      startupName: 'SmartWallet',
      requestedAmount: 350000,
      status: 'withdrawn',
      submittedDate: new Date(2023, 3, 20),
      category: 'FinTech',
    },
  ];

  // Filter functions
  const filteredCalls = sponsorCalls.filter(call => {
    const matchesQuery = call.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        call.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        call.category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && call.status === statusFilter;
  });

  const filteredApplications = applications.filter(app => {
    const matchesQuery = app.startupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.callTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.category.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: SponsorCallStatus | ApplicationStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-muted text-muted-foreground hover:bg-muted">Draft</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Published</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Closed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Archived</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Pending</Badge>;
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
    total: sponsorCalls.length,
    published: sponsorCalls.filter(call => call.status === 'published').length,
    closed: sponsorCalls.filter(call => call.status === 'closed').length,
    draft: sponsorCalls.filter(call => call.status === 'draft').length,
    archived: sponsorCalls.filter(call => call.status === 'archived').length,
    totalFunding: sponsorCalls.reduce((sum, call) => sum + call.fundingAmount, 0),
  };

  const applicationStats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
    totalRequestedFunding: applications.reduce((sum, app) => sum + app.requestedAmount, 0),
    approvedFunding: applications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + app.requestedAmount, 0),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Calls Management</CardTitle>
          <CardDescription>
            Manage funding opportunities and sponsorships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="calls">Sponsor Calls</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>
              
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>{activeTab === 'calls' ? 'Create Call' : 'Add Application'}</span>
              </Button>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                        <p className="text-xs text-muted-foreground">Active Calls</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">{callStats.closed + callStats.archived}</div>
                        <p className="text-xs text-muted-foreground">Closed/Archived</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(callStats.totalFunding)}</div>
                        <p className="text-xs text-muted-foreground">Total Funding</p>
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
                        <div className="text-2xl font-bold text-blue-600">{applicationStats.pending}</div>
                        <p className="text-xs text-muted-foreground">Pending Review</p>
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
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(applicationStats.approvedFunding)}</div>
                        <p className="text-xs text-muted-foreground">Approved Funding</p>
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
                  placeholder={`Search ${activeTab === 'calls' ? 'sponsor calls' : 'applications'}...`}
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
                      <SelectItem value="pending">Pending</SelectItem>
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
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Funding</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.title}</TableCell>
                          <TableCell>{call.organization}</TableCell>
                          <TableCell>{getStatusBadge(call.status)}</TableCell>
                          <TableCell>{formatCurrency(call.fundingAmount)}</TableCell>
                          <TableCell>{formatDate(call.applicationDeadline)}</TableCell>
                          <TableCell>{call.applicationsCount}</TableCell>
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
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Applications</span>
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
                        <TableHead>Sponsor Call</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.startupName}</TableCell>
                          <TableCell>{app.callTitle}</TableCell>
                          <TableCell>{app.category}</TableCell>
                          <TableCell>{formatCurrency(app.requestedAmount)}</TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>{formatDate(app.submittedDate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              {app.status === 'pending' && (
                                <>
                                  <Button variant="ghost" size="icon">
                                    <CircleCheck className="h-4 w-4 text-green-500" />
                                    <span className="sr-only">Approve</span>
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <CircleX className="h-4 w-4 text-red-500" />
                                    <span className="sr-only">Reject</span>
                                  </Button>
                                </>
                              )}
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
            Showing {activeTab === 'calls' ? filteredCalls.length : filteredApplications.length} of {activeTab === 'calls' ? sponsorCalls.length : applications.length} {activeTab}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSponsorCalls; 