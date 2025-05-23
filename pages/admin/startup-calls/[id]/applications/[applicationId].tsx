import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import axios from "axios";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  File,
  Download,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ReviewerAssignment from "@/components/admin/ReviewerAssignment";

// Application status type
type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

// Application data type
interface ApplicationData {
  id: string;
  callId: string;
  startupId: string | null;
  userId: string;
  startupName: string;
  website: string | null;
  foundingDate: string;
  teamSize: string;
  industry: string;
  stage: string;
  description: string;
  problem: string;
  solution: string;
  traction: string | null;
  businessModel: string;
  funding: string | null;
  useOfFunds: string;
  competitiveAdvantage: string;
  founderBio: string;
  pitchDeckUrl: string | null;
  financialsUrl: string | null;
  status: ApplicationStatus;
  reviewsCompleted: number;
  reviewsTotal: number;
  submittedAt: string;
  updatedAt: string;
  call: {
    id: string;
    title: string;
    status: string;
    industry: string;
    applicationDeadline: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  startup: {
    id: string;
    name: string;
    status: string;
  } | null;
}

// Review status type
type ReviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WITHDRAWN";

// Review data type
interface ReviewData {
  id: string;
  status: ReviewStatus;
  score?: number;
  innovationScore?: number;
  marketScore?: number;
  teamScore?: number;
  executionScore?: number;
  feedback?: string;
  assignedAt: string;
  dueDate?: string;
  completedAt?: string;
  reviewer: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function ApplicationDetails() {
  const router = useRouter();
  const { id, applicationId } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isAssigningReviewer, setIsAssigningReviewer] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch application data
  useEffect(() => {
    if (!id || !applicationId || status !== "authenticated") return;

    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/startup-calls/${id}/applications/${applicationId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Application not found");
          } else if (response.status === 403) {
            router.push("/dashboard");
            return;
          } else {
            throw new Error(`Error: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error("Error fetching application:", error);
        setError("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, applicationId, router, status]);

  // Fetch reviews for the application
  const fetchReviews = async () => {
    if (!applicationId || status !== "authenticated") return;

    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `/api/applications/${applicationId}/reviews`
      );
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch reviews when application is loaded
  useEffect(() => {
    if (application) {
      fetchReviews();
    }
  }, [application, applicationId]);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/auth/signin?callbackUrl=/admin/startup-calls/${id}/applications/${applicationId}`
      );
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router, id, applicationId]);

  // Update application status
  const updateStatus = async (newStatus: ApplicationStatus) => {
    if (!application) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `/api/startup-calls/${id}/applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === "UNDER_REVIEW" && { reviewsCompleted: 0 }),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      const updatedApplication = await response.json();
      setApplication({
        ...application,
        ...updatedApplication,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      setError("Failed to update application status");
    } finally {
      setUpdating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge component
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 hover:bg-blue-50"
          >
            Submitted
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-600 hover:bg-purple-50"
          >
            Under Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 hover:bg-green-50"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 hover:bg-red-50"
          >
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-600 hover:bg-slate-50"
          >
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get review status badge
  const getReviewStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 hover:bg-blue-50"
          >
            Pending
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-600 hover:bg-amber-50"
          >
            In Progress
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 hover:bg-green-50"
          >
            Completed
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 hover:bg-red-50"
          >
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-600 hover:bg-slate-50"
          >
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (status === "loading" || loading) {
    return (
      <Layout title="Application Details | Loading">
        <div className="flex justify-center w-full bg-background min-h-screen">
          <div className="w-full max-w-4xl px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="mt-4 text-muted-foreground">
              Loading application details...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !application) {
    return (
      <Layout title="Application Not Found">
        <div className="flex justify-center w-full bg-background min-h-screen">
          <div className="w-full max-w-4xl px-4 sm:px-6 py-8">
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold">
                {error || "Application Not Found"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                The application you're looking for doesn't exist or you don't
                have permission to view it.
              </p>
              <Button
                className="mt-6"
                onClick={() => router.push("/admin?section=startup-calls")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Startup Calls
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Application: ${application.startupName}`}>
      <div className="flex justify-center w-full bg-background min-h-screen">
        <div className="w-full max-w-4xl px-4 sm:px-6 py-8">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2"
              onClick={() => router.push("/admin?section=startup-calls")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Startup Calls
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {application.startupName}
                </h1>
                <p className="text-muted-foreground">
                  Application for{" "}
                  <span className="font-medium">{application.call.title}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(application.status)}
                <Badge variant="outline" className="bg-muted">
                  Submitted {formatDate(application.submittedAt)}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground"
                >
                  ID: {application.id.substring(0, 8)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Application status actions */}
          <Card className="mb-8 shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Application Status</CardTitle>
              <CardDescription>
                Update the status of this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    application.status === "SUBMITTED" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => updateStatus("SUBMITTED")}
                  disabled={updating || application.status === "SUBMITTED"}
                >
                  <Clock className="mr-1 h-4 w-4" />
                  Submitted
                </Button>

                <Button
                  variant={
                    application.status === "UNDER_REVIEW"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => updateStatus("UNDER_REVIEW")}
                  disabled={updating || application.status === "UNDER_REVIEW"}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Under Review
                </Button>

                <Button
                  variant={
                    application.status === "APPROVED" ? "default" : "outline"
                  }
                  size="sm"
                  className={
                    application.status === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                  onClick={() => updateStatus("APPROVED")}
                  disabled={updating || application.status === "APPROVED"}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>

                <Button
                  variant={
                    application.status === "REJECTED" ? "default" : "outline"
                  }
                  size="sm"
                  className={
                    application.status === "REJECTED"
                      ? "bg-red-600 hover:bg-red-700"
                      : ""
                  }
                  onClick={() => updateStatus("REJECTED")}
                  disabled={updating || application.status === "REJECTED"}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application details */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="w-full flex justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="details">Application Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="founder">Founder Info</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Company Information */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </h3>
                      <p className="text-base mt-1">
                        {application.startupName}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Website
                      </h3>
                      <p className="text-base mt-1">
                        {application.website ? (
                          <a
                            href={application.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {application.website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Founded
                      </h3>
                      <p className="text-base mt-1">
                        {formatDate(application.foundingDate)}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Team Size
                      </h3>
                      <p className="text-base mt-1">{application.teamSize}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Industry
                      </h3>
                      <p className="text-base mt-1">{application.industry}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Stage
                      </h3>
                      <p className="text-base mt-1">{application.stage}</p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Company Description
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product & Market */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Product & Market</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Problem Statement
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.problem}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Solution
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.solution}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Traction & Metrics
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.traction || "Not provided"}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Business Model
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.businessModel}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Competitive Advantage
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.competitiveAdvantage}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Funding & Financials */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Funding & Financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Previous Funding
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.funding || "Not provided"}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Use of Funds
                    </h3>
                    <p className="text-base whitespace-pre-line">
                      {application.useOfFunds}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Application Documents</CardTitle>
                  <CardDescription>
                    View and download submitted files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6 bg-muted/5">
                      <div className="flex items-center mb-4">
                        <File className="h-6 w-6 mr-3 text-blue-600" />
                        <h3 className="font-medium text-lg">Pitch Deck</h3>
                      </div>

                      {application.pitchDeckUrl ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            The startup's pitch presentation
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              window.open(
                                application.pitchDeckUrl || "",
                                "_blank"
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View Pitch Deck
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No pitch deck provided
                        </p>
                      )}
                    </div>

                    <div className="border rounded-lg p-6 bg-muted/5">
                      <div className="flex items-center mb-4">
                        <File className="h-6 w-6 mr-3 text-green-600" />
                        <h3 className="font-medium text-lg">
                          Financial Projections
                        </h3>
                      </div>

                      {application.financialsUrl ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            The startup's financial forecasts
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              window.open(
                                application.financialsUrl || "",
                                "_blank"
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View Financials
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No financials provided
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="founder" className="space-y-6">
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Founder Information</CardTitle>
                  <CardDescription>
                    Details about the founder who submitted this application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/5 border rounded-lg p-6">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="bg-primary/10 rounded-full p-3">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">
                          {application.user.name}
                        </h3>
                        <a
                          href={`mailto:${application.user.email}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {application.user.email}
                        </a>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Founder Bio
                      </h3>
                      <p className="text-base whitespace-pre-line">
                        {application.founderBio}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card className="shadow-sm border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Reviews & Evaluation</CardTitle>
                    <CardDescription>
                      Manage review assignments and track evaluation progress
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAssigningReviewer(true)}>
                    Assign Reviewer
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-medium">Review Progress</h3>
                        <div className="text-sm text-muted-foreground">
                          {application.reviewsCompleted} of{" "}
                          {application.reviewsTotal} reviews completed
                        </div>
                      </div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (application.reviewsCompleted /
                                application.reviewsTotal) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {reviewsLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">
                          No Reviews Yet
                        </h3>
                        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                          No reviewers have been assigned to this application
                          yet. Use the "Assign Reviewer" button to add
                          reviewers.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  {review.reviewer.image ? (
                                    <img
                                      src={review.reviewer.image}
                                      alt={review.reviewer.name}
                                      className="h-10 w-10 rounded-full"
                                    />
                                  ) : (
                                    <User className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {review.reviewer.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Assigned: {formatDate(review.assignedAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {getReviewStatusBadge(review.status)}
                                {review.dueDate && (
                                  <div className="text-xs flex items-center">
                                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span>
                                      Due: {formatDate(review.dueDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {review.status === "COMPLETED" && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold">
                                      {review.score}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Overall Score
                                    </div>
                                  </div>
                                  {review.innovationScore !== undefined && (
                                    <div className="text-center">
                                      <div className="text-lg font-medium">
                                        {review.innovationScore}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Innovation
                                      </div>
                                    </div>
                                  )}
                                  {review.marketScore !== undefined && (
                                    <div className="text-center">
                                      <div className="text-lg font-medium">
                                        {review.marketScore}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Market
                                      </div>
                                    </div>
                                  )}
                                  {review.teamScore !== undefined && (
                                    <div className="text-center">
                                      <div className="text-lg font-medium">
                                        {review.teamScore}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Team
                                      </div>
                                    </div>
                                  )}
                                  {review.executionScore !== undefined && (
                                    <div className="text-center">
                                      <div className="text-lg font-medium">
                                        {review.executionScore}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Execution
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {review.feedback && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">
                                      Feedback:
                                    </h4>
                                    <p className="text-sm whitespace-pre-line">
                                      {review.feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog for assigning reviewers */}
      {application && (
        <ReviewerAssignment
          applicationId={applicationId as string}
          applicationName={application.startupName}
          open={isAssigningReviewer}
          onClose={() => setIsAssigningReviewer(false)}
          onAssigned={fetchReviews}
        />
      )}
    </Layout>
  );
}
