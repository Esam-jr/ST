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
  Edit, 
  Trash2, 
  Eye, 
  Lock, 
  Mail,
  UserCheck,
  UserX,
  UserCog,
  Download,
  Shield,
  Users,
  Building,
  FileCheck
} from 'lucide-react';

// Define types
type UserRole = 'ADMIN' | 'ENTREPRENEUR' | 'REVIEWER' | 'SPONSOR';
type UserStatus = 'active' | 'pending' | 'suspended' | 'inactive';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinDate: Date;
  lastActive?: Date;
  organization?: string;
}

const AdminUserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Mock data
  const users: User[] = [
    {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      role: 'ADMIN',
      status: 'active',
      joinDate: new Date(2022, 3, 15),
      lastActive: new Date(2023, 5, 28),
    },
    {
      id: 'user-2',
      name: 'Sophia Williams',
      email: 'sophia@techstartup.com',
      role: 'ENTREPRENEUR',
      status: 'active',
      avatar: '/avatars/sophia.jpg',
      organization: 'Tech Startup Inc.',
      joinDate: new Date(2023, 1, 10),
      lastActive: new Date(2023, 5, 27),
    },
    {
      id: 'user-3',
      name: 'Michael Brown',
      email: 'michael.brown@venturecap.com',
      role: 'SPONSOR',
      status: 'active',
      organization: 'Venture Capital Group',
      joinDate: new Date(2022, 8, 5),
      lastActive: new Date(2023, 5, 25),
    },
    {
      id: 'user-4',
      name: 'Emma Davis',
      email: 'emma.davis@example.com',
      role: 'REVIEWER',
      status: 'active',
      joinDate: new Date(2022, 10, 20),
      lastActive: new Date(2023, 5, 26),
    },
    {
      id: 'user-5',
      name: 'James Wilson',
      email: 'james.wilson@greentechstartup.com',
      role: 'ENTREPRENEUR',
      status: 'pending',
      organization: 'GreenTech Solutions',
      joinDate: new Date(2023, 5, 18),
    },
    {
      id: 'user-6',
      name: 'Olivia Martinez',
      email: 'olivia.martinez@example.com',
      role: 'REVIEWER',
      status: 'suspended',
      joinDate: new Date(2022, 7, 12),
      lastActive: new Date(2023, 4, 15),
    },
    {
      id: 'user-7',
      name: 'William Taylor',
      email: 'william@investgroup.com',
      role: 'SPONSOR',
      status: 'inactive',
      organization: 'Investment Group LLC',
      joinDate: new Date(2022, 5, 3),
      lastActive: new Date(2023, 2, 10),
    },
  ];

  // Filter users based on search query, role filter, and status filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.organization && user.organization.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Helper function to format date
  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
      case 'ENTREPRENEUR':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Entrepreneur</Badge>;
      case 'REVIEWER':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Reviewer</Badge>;
      case 'SPONSOR':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sponsor</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">Pending</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Suspended</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-50">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter(user => user.status === 'active').length,
    pending: users.filter(user => user.status === 'pending').length,
    suspended: users.filter(user => user.status === 'suspended').length,
    inactive: users.filter(user => user.status === 'inactive').length,
  };

  // Calculate role statistics
  const roleStats = {
    admins: users.filter(user => user.role === 'ADMIN').length,
    entrepreneurs: users.filter(user => user.role === 'ENTREPRENEUR').length,
    reviewers: users.filter(user => user.role === 'REVIEWER').length,
    sponsors: users.filter(user => user.role === 'SPONSOR').length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userStats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{userStats.suspended + userStats.inactive}</div>
                  <p className="text-xs text-muted-foreground">Suspended/Inactive</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-xl font-bold">{roleStats.admins}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrepreneurs</p>
                  <p className="text-xl font-bold">{roleStats.entrepreneurs}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <FileCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reviewers</p>
                  <p className="text-xl font-bold">{roleStats.reviewers}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sponsors</p>
                  <p className="text-xl font-bold">{roleStats.sponsors}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions and Filters */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
              {selectedUsers.length > 0 && (
                <>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span>Activate</span>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    <span>Suspend</span>
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-[240px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[120px]">
                  <span>Role</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ENTREPRENEUR">Entrepreneur</SelectItem>
                  <SelectItem value="REVIEWER">Reviewer</SelectItem>
                  <SelectItem value="SPONSOR">Sponsor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <span>Status</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No users found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                              ) : null}
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.organization && (
                                <p className="text-xs text-muted-foreground">{user.organization}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(user.joinDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(user.lastActive)}</TableCell>
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
                              <UserCog className="h-4 w-4" />
                              <span className="sr-only">Manage Permissions</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Lock className="h-4 w-4" />
                              <span className="sr-only">Reset Password</span>
                            </Button>
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
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminUserManagement; 