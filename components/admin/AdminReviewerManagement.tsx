import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  MoreHorizontal,
  Eye, 
  Edit,
  Trash,
  Mail,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Types
interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinedDate: Date;
  assignedReviews: number;
  completedReviews: number;
  pendingReviews: number;
  averageScore?: number;
  expertise?: string[];
}

const AdminReviewerManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isAddReviewerOpen, setIsAddReviewerOpen] = useState(false);
  const [isEditReviewerOpen, setIsEditReviewerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    expertise: '',
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    expertise: '',
  });
  const { toast } = useToast();

  // Fetch reviewers when component mounts
  useEffect(() => {
    fetchReviewers();
  }, []);

  // Fetch reviewers from API
  const fetchReviewers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/users/reviewers');
      setReviewers(data);
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviewers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes for Add form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form input changes for Edit form
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add reviewer form submission
  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate password
      if (formData.password.length < 6) {
        toast({
          title: 'Error',
          description: 'Password must be at least 6 characters long.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Call API to create reviewer
      const { data } = await axios.post('/api/users/create-reviewer', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        expertise: formData.expertise ? formData.expertise.split(',').map(item => item.trim()) : [],
      });
      
      // Add the new reviewer to state with proper structure
      const newReviewer: Reviewer = {
        id: data.reviewer.id,
        name: data.reviewer.name,
        email: data.reviewer.email,
        role: data.reviewer.role,
        status: 'active',
        joinedDate: new Date(data.reviewer.createdAt),
        assignedReviews: 0,
        completedReviews: 0,
        pendingReviews: 0,
        expertise: formData.expertise ? formData.expertise.split(',').map(item => item.trim()) : [],
      };
      
      setReviewers(prev => [...prev, newReviewer]);
      setIsAddReviewerOpen(false);
      setFormData({ name: '', email: '', password: '', expertise: '' });
      
      toast({
        title: 'Success',
        description: `${formData.name} has been added as a reviewer.`,
      });
    } catch (error: any) {
      console.error('Error adding reviewer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add reviewer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit reviewer form submission
  const handleEditReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate password if provided
      if (editFormData.password && editFormData.password.length < 6) {
        toast({
          title: 'Error',
          description: 'Password must be at least 6 characters long.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Call API to update reviewer
      const { data } = await axios.put(`/api/users/reviewer/${editFormData.id}`, {
        name: editFormData.name,
        email: editFormData.email,
        password: editFormData.password || undefined, // Only send password if provided
        expertise: editFormData.expertise ? editFormData.expertise.split(',').map(item => item.trim()) : [],
      });

      // Update the reviewer in state
      setReviewers(prevReviewers => 
        prevReviewers.map(r => 
          r.id === editFormData.id ? {
            ...r,
            name: editFormData.name,
            email: editFormData.email,
            expertise: editFormData.expertise ? editFormData.expertise.split(',').map(item => item.trim()) : [],
          } : r
        )
      );

      setIsEditReviewerOpen(false);
      setEditFormData({ id: '', name: '', email: '', password: '', expertise: '' });
      
      toast({
        title: 'Success',
        description: 'Reviewer has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating reviewer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update reviewer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a reviewer
  const handleDeleteReviewer = async () => {
    if (!selectedReviewer) return;
    
    setIsSubmitting(true);
    
    try {
      // Call API to delete reviewer
      await axios.delete(`/api/users/reviewer/${selectedReviewer.id}`);
      
      // Remove the reviewer from state
      setReviewers(prev => prev.filter(r => r.id !== selectedReviewer.id));
      
      setDeleteConfirmOpen(false);
      setSelectedReviewer(null);
      
      toast({
        title: 'Success',
        description: 'Reviewer has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting reviewer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete reviewer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the edit dialog and set the initial form data
  const handleOpenEditDialog = (reviewer: Reviewer) => {
    setEditFormData({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      password: '', // Don't pre-fill password
      expertise: reviewer.expertise ? reviewer.expertise.join(', ') : '',
    });
    setIsEditReviewerOpen(true);
  };

  // Open delete confirmation dialog and set the selected reviewer
  const handleOpenDeleteDialog = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer);
    setDeleteConfirmOpen(true);
  };

  // Filter reviewers based on search, status, and tab
  const filteredReviewers = reviewers.filter((reviewer) => {
    const matchesSearch = 
      reviewer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reviewer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reviewer.expertise?.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || reviewer.status === statusFilter;
    
    let matchesTab = true;
    if (activeTab === 'active') {
      matchesTab = reviewer.status === 'active';
    } else if (activeTab === 'inactive') {
      matchesTab = reviewer.status === 'inactive';
    }
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Calculate statistics
  const stats = {
    total: reviewers.length,
    active: reviewers.filter(r => r.status === 'active').length,
    inactive: reviewers.filter(r => r.status === 'inactive').length,
    totalAssigned: reviewers.reduce((sum, r) => sum + r.assignedReviews, 0),
    totalCompleted: reviewers.reduce((sum, r) => sum + r.completedReviews, 0),
    completionRate: Math.round(
      (reviewers.reduce((sum, r) => sum + r.completedReviews, 0) / 
      Math.max(1, reviewers.reduce((sum, r) => sum + r.assignedReviews, 0))) * 100
    ),
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: 'active' | 'inactive') => {
    return status === 'active' ? (
      <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Active</Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-50">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Reviewer Management</CardTitle>
              <CardDescription>
                Manage reviewers and track their performance
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddReviewerOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add Reviewer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Reviewers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalAssigned}</div>
                  <p className="text-xs text-muted-foreground">Total Assigned</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalCompleted}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviewers..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Status</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reviewers Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviewers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No reviewers found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviewers.map((reviewer) => (
                      <TableRow key={reviewer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {reviewer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{reviewer.name}</div>
                              <div className="text-sm text-muted-foreground">{reviewer.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(reviewer.status)}</TableCell>
                        <TableCell>{formatDate(reviewer.joinedDate)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {reviewer.expertise?.slice(0, 2).map((exp, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {exp}
                              </Badge>
                            ))}
                            {reviewer.expertise && reviewer.expertise.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{reviewer.expertise.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{reviewer.assignedReviews}</TableCell>
                        <TableCell>{reviewer.completedReviews}</TableCell>
                        <TableCell>{reviewer.pendingReviews}</TableCell>
                        <TableCell>
                          {reviewer.assignedReviews > 0
                            ? Math.round((reviewer.completedReviews / reviewer.assignedReviews) * 100)
                            : 0}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48" align="end">
                                <div className="flex flex-col space-y-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="justify-start"
                                    onClick={() => handleOpenEditDialog(reviewer)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" className="justify-start">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Contact
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="justify-start text-red-600"
                                    onClick={() => handleOpenDeleteDialog(reviewer)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Add Reviewer Dialog */}
      <Dialog open={isAddReviewerOpen} onOpenChange={setIsAddReviewerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Reviewer</DialogTitle>
            <DialogDescription>
              Enter the details of the new reviewer. They will need this information to log in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddReviewer}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="expertise" className="text-sm font-medium">
                  Areas of Expertise
                </label>
                <Input
                  id="expertise"
                  name="expertise"
                  placeholder="e.g. Technology, Finance, Healthcare (comma separated)"
                  value={formData.expertise}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter comma-separated areas of expertise
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddReviewerOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Reviewer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Reviewer Dialog */}
      <Dialog open={isEditReviewerOpen} onOpenChange={setIsEditReviewerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reviewer</DialogTitle>
            <DialogDescription>
              Update the reviewer's information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditReviewer}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Full name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-password" className="text-sm font-medium">
                  New Password (Optional)
                </label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editFormData.password}
                  onChange={handleEditInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long if provided
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-expertise" className="text-sm font-medium">
                  Areas of Expertise
                </label>
                <Input
                  id="edit-expertise"
                  name="expertise"
                  placeholder="e.g. Technology, Finance, Healthcare (comma separated)"
                  value={editFormData.expertise}
                  onChange={handleEditInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter comma-separated areas of expertise
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditReviewerOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Reviewer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reviewer <span className="font-semibold">{selectedReviewer?.name}</span>. 
              This action cannot be undone. 
              {selectedReviewer?.assignedReviews ? 
                <div className="mt-2 flex items-center text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  This reviewer has {selectedReviewer.pendingReviews} pending review assignments.
                </div> 
                : null
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteReviewer();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReviewerManagement; 