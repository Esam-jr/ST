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
import { Loader2, ExternalLink, CreditCard, CheckCircle, Clock, HourglassIcon, XCircle, InfoIcon, AlertCircle } from "lucide-react";
import Link from "next/link";

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
  nextSteps?: string;
  adminNotes?: string;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" = "outline";
  let icon = null;

  switch (status.toUpperCase()) {
    case "APPROVED":
      variant = "success";
      icon = <CheckCircle className="h-4 w-4 mr-1" />;
      break;
    case "PRE_APPROVED":
      variant = "default";
      icon = <Clock className="h-4 w-4 mr-1" />;
      break;
    case "PENDING":
      variant = "secondary";
      icon = <HourglassIcon className="h-4 w-4 mr-1" />;
      break;
    case "REJECTED":
      variant = "destructive";
      icon = <XCircle className="h-4 w-4 mr-1" />;
      break;
    default:
      variant = "outline";
  }

  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {status}
    </Badge>
  );
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
              <Link href="/sponsorship-opportunities">
                View Opportunities
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
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
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      {application.opportunity.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {application.opportunity.startupCall?.title || "Direct Sponsorship"}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(application.amount, application.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Applied On</p>
                    <p className="font-medium">
                      {format(new Date(application.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {application.updatedAt 
                        ? format(new Date(application.updatedAt), "MMM d, yyyy")
                        : format(new Date(application.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {application.status === "PRE_APPROVED" && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <InfoIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Next Steps</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {application.nextSteps || 
                            "Our team will contact you shortly to discuss the details and finalize the sponsorship agreement."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {application.status === "APPROVED" && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleTransferFund(application.id)}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Transfer Fund
                    </Button>
                  </div>
                )}

                {application.status === "REJECTED" && application.adminNotes && (
                  <div className="mt-4 p-4 bg-destructive/5 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <h4 className="font-medium text-destructive">Feedback</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {application.adminNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/sponsorship-applications/${application.id}`}>
                      View Details
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              You haven't submitted any sponsorship applications yet.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/sponsorship-opportunities">
                View Opportunities
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
