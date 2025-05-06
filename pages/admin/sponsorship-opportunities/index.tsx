import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SponsorshipOpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['admin', 'sponsorship-opportunities'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sponsorship-opportunities');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      return response.json();
    },
  });

  const filteredOpportunities = opportunities?.filter((opportunity: any) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(search.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sponsorship Opportunities</h1>
          <Link href="/admin/sponsorship-opportunities/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Opportunity
            </Button>
          </Link>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredOpportunities?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No opportunities found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities?.map((opportunity: any) => (
                  <TableRow key={opportunity.id}>
                    <TableCell className="font-medium">{opportunity.title}</TableCell>
                    <TableCell>{formatCurrency(opportunity.amount)}</TableCell>
                    <TableCell>{formatDate(opportunity.deadline)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          opportunity.status === 'OPEN'
                            ? 'success'
                            : opportunity.status === 'CLOSED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {opportunity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/sponsorship-opportunities/${opportunity.id}/applications`}
                        className="text-blue-600 hover:underline"
                      >
                        View Applications
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/sponsorship-opportunities/${opportunity.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
} 