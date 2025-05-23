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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  CheckCircle,
  Download,
  Building,
  Globe,
  Users,
  Calendar as CalendarIcon,
  Save,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define types
type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";
type ReviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WITHDRAWN";

interface ApplicationReview {
  id: string;
  status: ReviewStatus;
  assignedAt: string;
  dueDate: string;
  completedAt?: string;
  score?: number;
  innovationScore?: number;
  marketScore?: number;
  teamScore?: number;
  executionScore?: number;
  feedback?: string;
  application: {
    id: string;
    startupName: string;
    industry: string;
    stage: string;
    status: ApplicationStatus;
    submittedAt: string;
    call: {
      id: string;
      title: string;
    };
  };
}

interface Application {
  id: string;
  callId: string;
  callTitle: string;
  submittedAt: string;
  status: ApplicationStatus;

  // Startup information
  startupName: string;
  website?: string;
  foundingDate: string;
  teamSize: string;
  industry: string;
  stage: string;
  description: string;

  // Application details
  problem: string;
  solution: string;
  traction?: string;
  businessModel: string;
  funding?: string;
  useOfFunds: string;
  competitiveAdvantage: string;
  founderBio: string;

  // Files
  pitchDeckUrl?: string;
  financialsUrl?: string;
}

export default function ReviewerReview() {
  const router = useRouter();
  const { id } = router.query;
  const isViewMode = router.query.view === "true";
  const { data: session, status: sessionStatus } = useSession();

  // Application data
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Review form state
  const [score, setScore] = useState<number>(0);
  const [innovationScore, setInnovationScore] = useState<number>(0);
  const [marketScore, setMarketScore] = useState<number>(0);
  const [teamScore, setTeamScore] = useState<number>(0);
  const [executionScore, setExecutionScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  // Calculate overall score whenever any individual score changes
  useEffect(() => {
    const totalScore = Math.round(
      (innovationScore + marketScore + teamScore + executionScore) / 4
    );
    setScore(totalScore);
  }, [innovationScore, marketScore, teamScore, executionScore]);

  const { toast } = useToast();

  // Generate a unique key for localStorage based on the review assignment ID
  const getStorageKey = () => {
    return `review_draft_${id}`;
  };

  // Save draft to localStorage
  const saveDraft = () => {
    if (!id || isViewMode || (review && review.status === "COMPLETED")) return;

    const draftData = {
      score,
      innovationScore,
      marketScore,
      teamScore,
      executionScore,
      feedback,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(draftData));
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  // Create debounced version of saveDraft
  const debouncedSaveDraft = debounce(() => {
    setIsSaving(true);
    saveDraft();
  }, 2000);

  // Load draft from localStorage
  const loadDraft = () => {
    if (!id || isViewMode || (review && review.status === "COMPLETED")) return;

    try {
      const savedDraft = localStorage.getItem(getStorageKey());
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);

        // Only load if there's actual data
        if (draftData.score) setScore(draftData.score);
        if (draftData.innovationScore)
          setInnovationScore(draftData.innovationScore);
        if (draftData.marketScore) setMarketScore(draftData.marketScore);
        if (draftData.teamScore) setTeamScore(draftData.teamScore);
        if (draftData.executionScore)
          setExecutionScore(draftData.executionScore);
        if (draftData.feedback) setFeedback(draftData.feedback);
        if (draftData.timestamp) setLastSaved(new Date(draftData.timestamp));

        toast({
          title: "Draft loaded",
          description: "Your previous review draft has been loaded",
        });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  // Clear draft from localStorage after submission
  const clearDraft = () => {
    if (!id) return;
    localStorage.removeItem(getStorageKey());
  };

  // Redirect if not authenticated or not reviewer
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this page",
        variant: "default",
      });
      router.push("/auth/signin?callbackUrl=/reviewer-dashboard");
      return;
    }

    if (session?.user?.role !== "REVIEWER") {
      toast({
        title: "Access Denied",
        description: "Only reviewers can access this page",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }
  }, [sessionStatus, session, router, toast]);

  // Fetch review data
  useEffect(() => {
    if (!id || sessionStatus !== "authenticated") return;

    const fetchReview = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reviewer/assignments/${id}`);
        setReview(response.data);

        // Set form values if review exists
        if (response.data) {
          setScore(response.data.score || 0);
          setInnovationScore(response.data.innovationScore || 0);
          setMarketScore(response.data.marketScore || 0);
          setTeamScore(response.data.teamScore || 0);
          setExecutionScore(response.data.executionScore || 0);
          setFeedback(response.data.feedback || "");

          // Set application data
          if (response.data.application) {
            setApplication({
              id: response.data.application.id,
              callId: response.data.application.call.id,
              callTitle: response.data.application.call.title,
              submittedAt: response.data.application.submittedAt,
              status: response.data.application.status,
              startupName: response.data.application.startupName,
              industry: response.data.application.industry,
              stage: response.data.application.stage,
              description: response.data.application.description,
              problem: response.data.application.problem,
              solution: response.data.application.solution,
              businessModel: response.data.application.businessModel,
              useOfFunds: response.data.application.useOfFunds,
              competitiveAdvantage:
                response.data.application.competitiveAdvantage,
              founderBio: response.data.application.founderBio,
              teamSize: response.data.application.teamSize,
              foundingDate: response.data.application.foundingDate,
              website: response.data.application.website,
              traction: response.data.application.traction,
              funding: response.data.application.funding,
              pitchDeckUrl: response.data.application.pitchDeckUrl,
              financialsUrl: response.data.application.financialsUrl,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching review:", error);
        toast({
          title: "Error",
          description: "Failed to load review data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [id, sessionStatus, toast]);

  // Auto-save effect
  useEffect(() => {
    if (isViewMode || (review && review.status === "COMPLETED")) return;

    debouncedSaveDraft();

    // Clean up the debounce on unmount
    return () => {
      debouncedSaveDraft.cancel();
    };
  }, [
    score,
    innovationScore,
    marketScore,
    teamScore,
    executionScore,
    feedback,
  ]);

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-50">
            Submitted
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">
            Under Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-50 text-green-600 hover:bg-green-50">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50">
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge className="bg-gray-50 text-gray-600 hover:bg-gray-50">
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Handle review form submission request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  // Handle review submission after confirmation
  const handleSubmitReview = async () => {
    if (!review || !application) return;

    setError("");
    setSubmitting(true);

    try {
      await axios.post(`/api/applications/${application.id}/submit-review`, {
        score,
        innovationScore,
        marketScore,
        teamScore,
        executionScore,
        feedback,
      });

      // Clear the draft after successful submission
      clearDraft();

      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully",
      });

      // Redirect back to the dashboard
      router.push("/reviewer-dashboard");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setError(error.response?.data?.message || "Failed to submit review");
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Application Review | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Application Review | Error">
        <div className="container mx-auto px-4 py-8">
          <ErrorAlert message={error} title={""} />
          <Button
            className="mt-4"
            onClick={() => router.push("/reviewer-dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!application || !review) {
    return (
      <Layout title="Application Review | Not Found">
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Review Assignment Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The review assignment you're looking for doesn't exist or you don't
            have permission to access it.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push("/reviewer-dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviewer Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Review for ${application.startupName}`}>
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-y-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 -ml-2 text-sm text-muted-foreground"
                  onClick={() => router.push("/reviewer-dashboard")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to dashboard
                </Button>

                <h1 className="text-2xl font-bold tracking-tight">
                  Review for {application.startupName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Submitted on {formatDate(application.submittedAt)}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <span className="mr-2 text-sm text-muted-foreground">
                    Application Status:
                  </span>
                  {getStatusBadge(application.status)}
                </div>
                {!isViewMode && review.dueDate && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Due by: {formatDate(review.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Application Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Startup Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Name
                      </h3>
                      <p className="mt-1">{application.startupName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Industry
                      </h3>
                      <p className="mt-1">{application.industry}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Stage
                      </h3>
                      <p className="mt-1">{application.stage}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Team Size
                      </h3>
                      <p className="mt-1">{application.teamSize}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Description
                    </h3>
                    <p className="mt-1">{application.description}</p>
                  </div>
                  {application.website && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Website
                      </h3>
                      <p className="mt-1">
                        <a
                          href={application.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {application.website}
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Problem & Solution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Problem
                    </h3>
                    <p className="mt-1">{application.problem}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Solution
                    </h3>
                    <p className="mt-1">{application.solution}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Business Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Business Model
                    </h3>
                    <p className="mt-1">{application.businessModel}</p>
                  </div>
                  {application.traction && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Traction
                      </h3>
                      <p className="mt-1">{application.traction}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Competitive Advantage
                    </h3>
                    <p className="mt-1">{application.competitiveAdvantage}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funding & Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.funding && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Previous Funding
                      </h3>
                      <p className="mt-1">{application.funding}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Use of Funds
                    </h3>
                    <p className="mt-1">{application.useOfFunds}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Founder Bio
                    </h3>
                    <p className="mt-1">{application.founderBio}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents */}
            {(application.pitchDeckUrl || application.financialsUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {application.pitchDeckUrl && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(application.pitchDeckUrl, "_blank")
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        View Pitch Deck
                      </Button>
                    )}
                    {application.financialsUrl && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(application.financialsUrl, "_blank")
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        View Financials
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isViewMode || review.status === "COMPLETED"
                    ? "Your Review"
                    : "Submit Your Review"}
                  {!isViewMode && review.status !== "COMPLETED" && (
                    <Badge variant="outline" className="ml-2">
                      Draft
                    </Badge>
                  )}
                </CardTitle>
                {!isViewMode && review.status !== "COMPLETED" && (
                  <CardDescription>
                    Please evaluate this application based on the criteria below. Your review will be automatically saved as a draft.
                  </CardDescription>
                )}
                {!isViewMode && review.status !== "COMPLETED" && lastSaved && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {isSaving
                        ? "Saving..."
                        : `Draft saved at ${formatTime(lastSaved)}`}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {error && <ErrorAlert message={error} title={""} />}

                <form onSubmit={handleSubmitRequest} className="space-y-8">
                  {/* Scoring Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Evaluation Scores</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Overall Score:</span>
                        <Badge 
                          variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"} 
                          className={`text-lg ${score >= 70 ? "bg-green-100 text-green-800" : score >= 40 ? "bg-yellow-100 text-yellow-800" : ""}`}
                        >
                          {score}/100
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Innovation Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="innovationScore" className="text-base">
                            Innovation
                      </Label>
                          <Badge variant="outline" className="ml-2">
                            {innovationScore}/100
                          </Badge>
                        </div>
                      <Input
                        id="innovationScore"
                          type="range"
                        min="0"
                        max="100"
                        value={innovationScore}
                          onChange={(e) => setInnovationScore(Number(e.target.value))}
                          className="w-full"
                      />
                        <p className="text-sm text-muted-foreground">
                          How innovative and unique is the solution?
                        </p>
                    </div>

                    {/* Market Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="marketScore" className="text-base">
                            Market Potential
                          </Label>
                          <Badge variant="outline" className="ml-2">
                            {marketScore}/100
                          </Badge>
                        </div>
                      <Input
                        id="marketScore"
                          type="range"
                        min="0"
                        max="100"
                        value={marketScore}
                        onChange={(e) => setMarketScore(Number(e.target.value))}
                          className="w-full"
                      />
                        <p className="text-sm text-muted-foreground">
                          How large and accessible is the target market?
                        </p>
                    </div>

                    {/* Team Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="teamScore" className="text-base">
                            Team
                          </Label>
                          <Badge variant="outline" className="ml-2">
                            {teamScore}/100
                          </Badge>
                        </div>
                      <Input
                        id="teamScore"
                          type="range"
                        min="0"
                        max="100"
                        value={teamScore}
                        onChange={(e) => setTeamScore(Number(e.target.value))}
                          className="w-full"
                      />
                        <p className="text-sm text-muted-foreground">
                          How strong and experienced is the team?
                        </p>
                    </div>

                    {/* Execution Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="executionScore" className="text-base">
                            Execution
                      </Label>
                          <Badge variant="outline" className="ml-2">
                            {executionScore}/100
                          </Badge>
                        </div>
                      <Input
                        id="executionScore"
                          type="range"
                        min="0"
                        max="100"
                        value={executionScore}
                          onChange={(e) => setExecutionScore(Number(e.target.value))}
                          className="w-full"
                      />
                        <p className="text-sm text-muted-foreground">
                          How feasible and well-planned is the execution?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="feedback" className="text-lg font-semibold">
                        Detailed Feedback
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {feedback.length}/1000 characters
                      </span>
                    </div>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      placeholder="Provide detailed feedback about the application..."
                      maxLength={1000}
                      className="resize-none"
                    />
                    <p className="text-sm text-muted-foreground">
                      Please provide constructive feedback that will help the startup improve their application.
                    </p>
                  </div>

                  {/* Submit button */}
                  {!isViewMode && review.status !== "COMPLETED" && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/reviewer-dashboard")}
                      >
                        Cancel
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={submitting} className="min-w-[120px]">
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Review"
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Submit Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to submit this review? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSubmitReview}>
                              Submit
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {(isViewMode || review.status === "COMPLETED") && (
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        type="button"
                        onClick={() => router.push("/reviewer-dashboard")}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
}
