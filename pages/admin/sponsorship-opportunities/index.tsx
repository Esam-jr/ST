import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface SponsorshipOpportunity {
  id: string;
  title: string;
  status: string;
  minAmount: number;
  maxAmount: number;
  deadline: string | null;
  viewsCount: number;
  shareCount: number;
  createdAt: string;
  startupCall?: {
    title: string;
  };
}

export default function AdminSponsorshipOpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchOpportunities();
    } else if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, session]);

  const fetchOpportunities = async () => {
    try {
      const response = await axios.get('/api/sponsorship-opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
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
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      await axios.delete(`/api/sponsorship-opportunities/${id}`);
      toast({
        title: 'Success',
        description: 'Opportunity deleted successfully',
      });
      fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete opportunity',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Sponsorship Opportunities">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Sponsorship Opportunities">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sponsorship Opportunities</h1>
          <Link href="/admin/sponsorship-opportunities/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Opportunity
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount Range</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell className="font-medium">
                    {opportunity.title}
                    {opportunity.startupCall && (
                      <div className="text-sm text-gray-500">
                        {opportunity.startupCall.title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        opportunity.status === 'OPEN'
                          ? 'default'
                          : opportunity.status === 'CLOSED'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {opportunity.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(opportunity.minAmount)} -{' '}
                    {formatCurrency(opportunity.maxAmount)}
                  </TableCell>
                  <TableCell>{formatDate(opportunity.deadline)}</TableCell>
                  <TableCell>{opportunity.viewsCount}</TableCell>
                  <TableCell>{opportunity.shareCount}</TableCell>
                  <TableCell>
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/sponsorship-opportunities/${opportunity.id}`}
                        target="_blank"
                      >
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link
                        href={`/admin/sponsorship-opportunities/${opportunity.id}/edit`}
                      >
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(opportunity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
