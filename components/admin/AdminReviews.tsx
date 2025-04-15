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
  Download, 
  Search,
  FileText,
  Eye
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define types
type ReviewStatus = 'pending' | 'completed' | 'overdue';

interface Review {
  id: string;
  applicationId: string;
  startupName: string;
  callTitle: string;
  reviewerName: string;
  assignedDate: Date;
  dueDate: Date;
  status: ReviewStatus;
  score?: number;
}

const AdminReviews: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock data for reviews
  const reviews: Review[] = [
    {
      id: 'rev-001',
      applicationId: 'app-001',
      startupName: 'EcoSolutions',
      callTitle: 'Tech Innovation Challenge 2023',
      reviewerName: 'Michael Brown',
      assignedDate: new Date(2023, 5, 11),
      dueDate: new Date(2023, 5, 18),
      status: 'completed',
      score: 85,
    },
    {
      id: 'rev-002',
      applicationId: 'app-001',
      startupName: 'EcoSolutions',
      callTitle: 'Tech Innovation Challenge 2023',
      reviewerName: 'Emma Davis',
      assignedDate: new Date(2023, 5, 11),
      dueDate: new Date(2023, 5, 18),
      status: 'completed',
      score: 78,
    },
    {
      id: 'rev-003',
      applicationId: 'app-002',
      startupName: 'CloudSecure',
      callTitle: 'Tech Innovation Challenge 2023',
      reviewerName: 'Michael Brown',
      assignedDate: new Date(2023, 5, 13),
      dueDate: new Date(2023, 5, 20),
      status: 'pending',
    },
    {
      id: 'rev-004',
      applicationId: 'app-002',
      startupName: 'CloudSecure',
      callTitle: 'Tech Innovation Challenge 2023',
      reviewerName: 'Jane Smith',
      assignedDate: new Date(2023, 5, 13),
      dueDate: new Date(2023, 5, 20),
      status: 'pending',
    },
    {
      id: 'rev-005',
      applicationId: 'app-003',
      startupName: 'MediTech Pro',
      callTitle: 'Healthcare Startups Program',
      reviewerName: 'Emma Davis',
      assignedDate: new Date(2023, 5, 16),
      dueDate: new Date(2023, 5, 23),
      status: 'overdue',
    },
  ];

  // Filter reviews based on search query and status filter
  const filteredReviews = reviews.filter(review => {
    const matchesQuery = review.startupName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.callTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && review.status === statusFilter;
  });

  // Helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Completed</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    total: reviews.length,
    completed: reviews.filter(review => review.status === 'completed').length,
    pending: reviews.filter(review => review.status === 'pending').length,
    overdue: reviews.filter(review => review.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Management</CardTitle>
          <CardDescription>
            Manage and track startup application reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="relative w-[280px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead>Call</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.startupName}</TableCell>
                      <TableCell>{review.callTitle}</TableCell>
                      <TableCell>{review.reviewerName}</TableCell>
                      <TableCell>{formatDate(review.assignedDate)}</TableCell>
                      <TableCell>{formatDate(review.dueDate)}</TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>{review.score || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Reviews
          </Button>
          <div className="text-sm text-muted-foreground">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminReviews; 