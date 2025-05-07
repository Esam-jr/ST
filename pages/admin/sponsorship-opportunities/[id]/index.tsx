import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  Check,
  X,
  MessageCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  ArrowRight,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
  _count?: {
    applications: number;
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
  sponsorName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  website: string | null;
  sponsorshipType: string;
  otherType: string | null;
  sponsor?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    website?: string | null;
  };
}

export default function SponsorshipOpportunityDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(
    null
  );
  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<SponsorshipApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=" + router.asPath);
    } else if (
      sessionStatus === "authenticated" &&
      session?.user?.role !== "ADMIN"
    ) {
      router.push("/dashboard");
    } else if (sessionStatus === "authenticated" && id) {
      fetchOpportunityData();
    }
  }, [sessionStatus, session, router, id]);

  useEffect(() => {
    if (id && session && activeTab === "applications") {
      fetchApplications();
    }
  }, [id, session, activeTab]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);

      // Fetch opportunity details
      const opportunityResponse = await axios.get(
        `/api/sponsorship-opportunities/${id}`
      );
      setOpportunity(opportunityResponse.data);

      // Fetch applications for this opportunity
      const applicationsResponse = await axios.get(
        `/api/sponsorship-opportunities/${id}/applications`
      );
      setApplications(applicationsResponse.data);
    } catch (error) {
      console.error("Error fetching opportunity data:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `/api/admin/sponsorship-opportunities/${id}/applications`
      );
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      setProcessingAction("status");
      await axios.patch(`/api/sponsorship-opportunities/${id}`, { status });

      setOpportunity((prev) => (prev ? { ...prev, status } : null));

      toast({
        title: "Success",
        description: `Opportunity status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update opportunity status",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApplicationStatusChange = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      setProcessingAction(applicationId);

      await axios.patch(`/api/sponsorship-applications/${applicationId}`, {
        status: newStatus,
      });

      // Update local state
      setApplications((prevApps) =>
        prevApps.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Success",
        description: `Application ${
          newStatus === "approved" ? "approved" : "rejected"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Closed
          </Badge>
        );
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      case "withdrawn":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Withdrawn
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewApplication = (application: SponsorshipApplication) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  const renderDetailsTab = () => {
    if (!opportunity) {
      return null;
    }

    return (
      <div>
        <div className="flex items-center mb-6">
          <Link href="/admin/sponsorship-opportunities" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{opportunity.title}</h1>
            <div className="flex items-center mt-2">
              <span className="mr-2 text-gray-500">Status:</span>
              {getStatusBadge(opportunity.status)}
            </div>
          </div>
          <div className="ml-auto space-x-2">
            <Link
              href={`/admin/sponsorship-opportunities/${opportunity.id}/edit`}
            >
              <Button variant="outline" className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            </Link>

            {opportunity.status === "draft" && (
              <Button
                onClick={() => handleStatusChange("active")}
                disabled={processingAction === "status"}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingAction === "status" ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Publish
                  </span>
                )}
              </Button>
            )}

            {opportunity.status === "active" && (
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("closed")}
                disabled={processingAction === "status"}
              >
                {processingAction === "status" ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <XCircle className="mr-2 h-4 w-4" />
                    Close
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-white"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="relative data-[state=active]:bg-white"
            >
              Applications
              {applications.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {applications.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span>Opportunity Details</span>
                  <div className="ml-auto">
                    <Badge
                      variant={
                        opportunity.status === "active"
                          ? "default"
                          : opportunity.status === "closed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs uppercase"
                    >
                      {opportunity.status}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700 whitespace-pre-line">
                      {opportunity.description}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Funding Range</h3>
                    <div className="flex items-center text-gray-700">
                      <DollarSign className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-xl font-medium">
                        {formatCurrency(
                          opportunity.minAmount,
                          opportunity.currency
                        )}{" "}
                        —
                        {formatCurrency(
                          opportunity.maxAmount,
                          opportunity.currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Dates</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <span className="text-sm text-gray-500">
                            Created:{" "}
                          </span>
                          <span>{formatDate(opportunity.createdAt)}</span>
                        </div>
                      </div>
                      {opportunity.updatedAt && (
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <span className="text-sm text-gray-500">
                              Last Updated:{" "}
                            </span>
                            <span>{formatDate(opportunity.updatedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {opportunity.startupCall && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-2">
                        Associated Startup Call
                      </h3>
                      <Link
                        href={`/admin/startup-calls/${opportunity.startupCallId}`}
                        className="text-primary hover:underline flex items-center"
                      >
                        {opportunity.startupCall.title}
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Sponsor Benefits</h3>
                  {opportunity.benefits.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-5">
                        {opportunity.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-700">
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500 italic">
                      No benefits specified
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sponsorship Applications</CardTitle>
                  <CardDescription>
                    Review and manage applications from sponsors interested in
                    this opportunity.
                  </CardDescription>
                </div>
                <Link
                  href={`/admin/sponsorship-opportunities/${opportunity.id}/applications`}
                  className="flex items-center text-sm text-blue-600 hover:underline"
                >
                  View All Applications
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-md">
                    <p className="text-gray-500 mb-4">
                      No applications have been submitted yet.
                    </p>
                    <p className="text-sm text-gray-400">
                      When sponsors apply, their applications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Sponsor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.slice(0, 5).map((application) => (
                          <TableRow
                            key={application.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div>
                                  {application.sponsor?.name ||
                                    application.sponsorName ||
                                    "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.sponsor?.email ||
                                    application.email ||
                                    "No email provided"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                application.amount,
                                application.currency
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(application.status)}
                            </TableCell>
                            <TableCell>
                              {formatDate(application.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Link
                                  href={`/admin/sponsorship-applications/${application.id}`}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                </Link>

                                {application.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-8"
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          application.id,
                                          "approved"
                                        )
                                      }
                                      disabled={
                                        processingAction === application.id
                                      }
                                    >
                                      {processingAction === application.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-green-700 rounded-full"></div>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Approve
                                        </>
                                      )}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 h-8"
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          application.id,
                                          "rejected"
                                        )
                                      }
                                      disabled={
                                        processingAction === application.id
                                      }
                                    >
                                      {processingAction === application.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-red-700 rounded-full"></div>
                                      ) : (
                                        <>
                                          <X className="h-4 w-4 mr-1" />
                                          Reject
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {applications.length > 5 && (
                      <div className="p-4 text-center border-t">
                        <Link
                          href={`/admin/sponsorship-opportunities/${opportunity.id}/applications`}
                        >
                          <Button variant="ghost" size="sm">
                            View all {applications.length} applications
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderApplicationsTab = () => {
    if (applications.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No applications received yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  {application.sponsor?.name ||
                    application.sponsorName ||
                    "Unknown"}
                </TableCell>
                <TableCell>
                  {application.sponsor?.email ||
                    application.email ||
                    "No email provided"}
                </TableCell>
                <TableCell>
                  {application.amount
                    ? formatCurrency(
                        application.amount,
                        application.currency || "USD"
                      )
                    : "Not specified"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      application.status === "APPROVED"
                        ? "default"
                        : application.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {application.status.charAt(0) +
                      application.status.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(application.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewApplication(application)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="flex items-center mb-6">
      <Link href="/admin/sponsorship-opportunities" className="mr-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>
      <h1 className="text-3xl font-bold">
        {opportunity ? opportunity.title : "Sponsorship Opportunity"}
      </h1>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (!opportunity) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Opportunity not found</p>
        </div>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="applications">
            Applications{" "}
            {opportunity._count?.applications ? (
              <Badge variant="secondary" className="ml-2">
                {opportunity._count.applications}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          {renderDetailsTab()}
        </TabsContent>
        <TabsContent value="applications" className="pt-4">
          {renderApplicationsTab()}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      <Head>
        <title>{opportunity?.title || "Sponsorship Opportunity"} | Admin</title>
      </Head>
      <div className="container py-6">
        {renderHeader()}
        <div className="mt-6">{renderContent()}</div>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApplication &&
                `Submitted on ${new Date(
                  selectedApplication.createdAt
                ).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>

          {/* Only render content if selectedApplication exists */}
          {selectedApplication && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Sponsor</h3>
                  <p className="font-medium">
                    {selectedApplication.sponsor?.name ||
                      selectedApplication.sponsorName ||
                      "Unknown"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <Badge
                    variant={
                      selectedApplication.status === "APPROVED"
                        ? "default"
                        : selectedApplication.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedApplication.status.charAt(0) +
                      selectedApplication.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Contact Information
                </h3>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <p>
                      {selectedApplication.sponsor?.email ||
                        selectedApplication.email ||
                        "No email provided"}
                    </p>
                  </div>
                  {(selectedApplication.phone ||
                    selectedApplication.sponsor?.phone) && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <p>
                        {selectedApplication.phone ||
                          selectedApplication.sponsor?.phone}
                      </p>
                    </div>
                  )}
                  {(selectedApplication.website ||
                    selectedApplication.sponsor?.website) && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a
                        href={
                          selectedApplication.website ||
                          selectedApplication.sponsor?.website
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {selectedApplication.website ||
                          selectedApplication.sponsor?.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Sponsorship Details
                </h3>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <p>
                      {selectedApplication.amount
                        ? formatCurrency(
                            selectedApplication.amount,
                            selectedApplication.currency || "USD"
                          )
                        : "Amount not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Sponsorship Type</h4>
                    <p>
                      {selectedApplication.sponsorshipType || "Not specified"}
                      {selectedApplication.sponsorshipType === "OTHER" &&
                      selectedApplication.otherType
                        ? ` (${selectedApplication.otherType})`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {selectedApplication.message && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Message</h3>
                  <p className="mt-1 whitespace-pre-line">
                    {selectedApplication.message}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            {selectedApplication &&
              selectedApplication.status === "PENDING" && (
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Handle rejection
                      setDialogOpen(false);
                      toast({
                        title: "Application rejected",
                        description: "The application has been rejected.",
                      });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      // Handle approval
                      setDialogOpen(false);
                      toast({
                        title: "Application approved",
                        description: "The application has been approved.",
                      });
                    }}
                  >
                    Approve
                  </Button>
                </div>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
