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
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Eye,
  Filter
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
  startupCallId: string;
  startupCall?: {
    title: string;
  };
  _count?: {
    applications: number;
  };
}

export default function SponsorshipOpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Redirect if not admin
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/sponsorship-opportunities');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchOpportunities();
    }
  }, [status, session, router]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sponsorship-opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching sponsorship opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sponsorship opportunities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await axios.delete(`/api/sponsorship-opportunities/${id}`);
        toast({
          title: 'Success',
          description: 'Sponsorship opportunity deleted successfully',
        });
        fetchOpportunities();
      } catch (error) {
        console.error('Error deleting opportunity:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete sponsorship opportunity',
          variant: 'destructive',
        });
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/sponsorship-opportunities/${id}`, { status: newStatus });
      toast({
        title: 'Success',
        description: `Opportunity status updated to ${newStatus}`,
      });
      fetchOpportunities();
    } catch (error) {
      console.error('Error updating opportunity status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update opportunity status',
        variant: 'destructive',
      });
    }
  };

  // Filter opportunities based on search query and status
  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout title="Sponsorship Opportunities Management">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sponsorship Opportunities</h1>
          <Link href="/admin/sponsorship-opportunities/create">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Opportunity
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Manage Sponsorship Opportunities</CardTitle>
            <CardDescription>
              Create and manage opportunities for sponsors to support startup initiatives.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search opportunities..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading opportunities...</p>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No sponsorship opportunities found.</p>
                <Link href="/admin/sponsorship-opportunities/create">
                  <Button variant="link" className="mt-2">
                    Create your first opportunity
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Funding Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opportunity) => (
                      <TableRow key={opportunity.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{opportunity.title}</div>
                            <div className="text-sm text-gray-500">
                              {opportunity.startupCall?.title || 'No associated call'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(opportunity.minAmount, opportunity.currency)} - {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(opportunity.status)}</TableCell>
                        <TableCell>{opportunity._count?.applications || 0}</TableCell>
                        <TableCell>{new Date(opportunity.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/sponsorship-opportunities/${opportunity.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/sponsorship-opportunities/edit/${opportunity.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {opportunity.status === 'draft' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(opportunity.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {opportunity.status === 'draft' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStatusChange(opportunity.id, 'active')}
                              >
                                Publish
                              </Button>
                            )}
                            {opportunity.status === 'active' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStatusChange(opportunity.id, 'closed')}
                              >
                                Close
                              </Button>
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
      </div>
    </Layout>
  );
} 