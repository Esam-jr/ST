import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CreditCard } from "lucide-react";

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
  deadline: string | null;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
}

interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  sponsorId: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  opportunity: SponsorshipOpportunity;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  switch (status.toUpperCase()) {
    case "APPROVED":
      variant = "default";
      break;
    case "PENDING":
      variant = "secondary";
      break;
    case "REJECTED":
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }

  return <Badge variant={variant}>{status}</Badge>;
};

export default function ApplicationsTable() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axios.get<SponsorshipApplication[]>(
          "/api/sponsors/me/applications"
        );
        setApplications(response.data);
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast({
          title: "Error",
          description:
            "Failed to load your applications. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchApplications();
    }
  }, [session, toast]);

  const handleTransferFund = (applicationId: string) => {
    // This will be replaced with Chapa integration in the future
    toast({
      title: "Coming Soon",
      description:
        "Fund transfer functionality will be integrated with Chapa payment gateway soon.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
          <CardDescription>
            You haven't submitted any sponsorship applications yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Browse sponsorship opportunities and submit an application to get
              started.
            </p>
            <Button className="mt-4" asChild>
              <a href="/sponsorship-opportunities">
                View Opportunities <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Applications</CardTitle>
        <CardDescription>
          Track the status of your sponsorship applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Startup Call</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.opportunity.title}
                </TableCell>
                <TableCell>
                  {application.opportunity.startupCall?.title || "N/A"}
                </TableCell>
                <TableCell>
                  {formatCurrency(application.amount, application.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={application.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(application.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {application.status.toUpperCase() === "APPROVED" ? (
                    <Button
                      size="sm"
                      onClick={() => handleTransferFund(application.id)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Transfer Fund
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/sponsorship-applications/${application.id}`}>
                        View Details
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
