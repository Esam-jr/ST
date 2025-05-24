import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Search, Filter, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import axios from 'axios';

interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  status: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  deadline: string | null;
  viewsCount: number;
  shareCount: number;
  createdAt: string;
  startupCall?: {
    title: string;
  };
}

interface Props {
  onStatsChange?: () => void;
}

export default function SponsorshipOpportunityList({ onStatsChange }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/sponsorship-opportunities");
      setOpportunities(response.data);
      
      // Trigger stats update when opportunities change
      if (onStatsChange) {
        onStatsChange();
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchOpportunities(), 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch opportunities. Please refresh the page.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/admin/sponsorship-opportunities/${id}`, {
        status: newStatus,
      });

      // Update local state
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === id ? { ...opp, status: newStatus } : opp
        )
      );

      // Trigger stats update
      if (onStatsChange) {
        onStatsChange();
      }

      toast({
        title: "Success",
        description: "Opportunity status updated successfully",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleCreateNew = () => {
    router.push('/admin/sponsorship-opportunities/create');
  };

  const handleEdit = async (id: string) => {
    try {
      await router.push(`/admin/sponsorship-opportunities/${id}/edit`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to edit page",
        variant: "destructive",
      });
    }
  };

  const handleViewApplications = async (id: string) => {
    try {
      await router.push(`/admin/sponsorship-opportunities/${id}/applications`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to applications page",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: "secondary", label: "Draft" },
      OPEN: { variant: "success", label: "Open" },
      CLOSED: { variant: "destructive", label: "Closed" },
      ARCHIVED: { variant: "outline", label: "Archived" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "default", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Sponsorship Opportunities</CardTitle>
            <CardDescription>
              Manage and track sponsorship opportunities
            </CardDescription>
          </div>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount Range</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading opportunities...
                  </TableCell>
                </TableRow>
              ) : filteredOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No opportunities found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell className="font-medium">{opportunity.title}</TableCell>
                    <TableCell>{getStatusBadge(opportunity.status)}</TableCell>
                    <TableCell>
                      {formatCurrency(opportunity.minAmount, opportunity.currency)} - {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                    </TableCell>
                    <TableCell>
                      {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'No deadline'}
                    </TableCell>
                    <TableCell>{opportunity.viewsCount}</TableCell>
                    <TableCell>{opportunity.shareCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(opportunity.id)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewApplications(opportunity.id)}>
                            View Applications
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 