import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

// Define types
interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  opportunity: {
    id: string;
    title: string;
    description?: string;
    minAmount: number;
    maxAmount: number;
    currency: string;
    status: string;
    deadline?: string;
    startupCall?: {
      title: string;
    };
  };
}

interface SponsorshipApplicationsTableProps {
  limit?: number;
}

export function SponsorshipApplicationsTable({
  limit,
}: SponsorshipApplicationsTableProps) {
  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/sponsors/me/applications");
      let data = response.data;

      // Apply limit if specified
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }

      setApplications(data);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications");
      toast({
        title: "Error",
        description: "Could not load your applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="mb-2 text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchApplications}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sponsorship Applications</CardTitle>
          <CardDescription>
            Your sponsorship applications will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <p className="mb-4 text-muted-foreground">
            You haven't submitted any sponsorship applications yet.
          </p>
          <Button>
            <Link
              href="/sponsorship-opportunities"
              className="flex items-center"
            >
              Browse Opportunities
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsorship Applications</CardTitle>
        <CardDescription>
          Track the status of your sponsorship applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.opportunity.title}
                  {application.opportunity.startupCall && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {application.opportunity.startupCall.title}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {formatCurrency(application.amount, application.currency)}
                </TableCell>
                <TableCell>{formatDate(application.createdAt)}</TableCell>
                <TableCell>{getStatusBadge(application.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Link
                      href={`/sponsorship-opportunities/${application.opportunityId}`}
                      className="flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {limit && applications.length >= limit && (
        <CardFooter className="flex justify-center border-t pt-6">
          <Button variant="outline">
            <Link
              href="/sponsor-dashboard/applications"
              className="flex items-center"
            >
              View All Applications
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
