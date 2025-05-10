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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardList,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

// Define types
type ReviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WITHDRAWN";

interface ReviewAssignment {
  id: string;
  status: ReviewStatus;
  assignedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  application: {
    id: string;
    startupName: string;
    industry: string;
    stage: string;
    status: string;
    submittedAt: string;
    call: {
      id: string;
      title: string;
    };
  };
}

export default function ReviewerDashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("pending");
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Redirect if not authenticated or not reviewer
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the reviewer dashboard",
        variant: "default",
      });
      router.push("/auth/signin?callbackUrl=/reviewer-dashboard");
      return;
    }

    if (session?.user?.role !== "REVIEWER") {
      toast({
        title: "Access Denied",
        description: "Only reviewers can access this dashboard",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }
  }, [sessionStatus, session, router, toast]);

  // Fetch review assignments
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/reviewer/assignments");
        setAssignments(response.data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast({
          title: "Error",
          description: "Failed to load review assignments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [sessionStatus, toast]);

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "WITHDRAWN":
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const startReview = async (assignmentId: string) => {
    try {
      // This endpoint needs to be created
      await axios.post(`/api/reviewer/assignments/${assignmentId}/start`);

      // Update the local state
      setAssignments(
        assignments.map((assignment) => {
          if (assignment.id === assignmentId) {
            return {
              ...assignment,
              status: "IN_PROGRESS" as ReviewStatus,
            };
          }
          return assignment;
        })
      );

      // Redirect to the review page
      router.push(`/reviewer/review/${assignmentId}`);
    } catch (error) {
      console.error("Error starting review:", error);
      toast({
        title: "Error",
        description: "Failed to start the review process",
        variant: "destructive",
      });
    }
  };

  // Filter assignments based on the active tab
  const filteredAssignments = assignments.filter((assignment) => {
    if (activeTab === "pending") {
      return ["PENDING", "IN_PROGRESS"].includes(assignment.status);
    } else if (activeTab === "completed") {
      return assignment.status === "COMPLETED";
    } else if (activeTab === "overdue") {
      return assignment.status === "OVERDUE";
    }
    return true;
  });

  if (loading) {
    return (
      <Layout title="Reviewer Dashboard | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reviewer Dashboard | Startup Call Management System">
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Reviewer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and complete your assigned application reviews
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Assignments
                  </CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Reviews
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assignments.filter((a) => a.status === "PENDING").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    In Progress
                  </CardTitle>
                  <Loader2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      assignments.filter((a) => a.status === "IN_PROGRESS")
                        .length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assignments.filter((a) => a.status === "COMPLETED").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Review Assignments</CardTitle>
                <CardDescription>
                  Manage your assigned startup reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No review assignments found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAssignments.map((assignment: ReviewAssignment) => (
                      <Card
                        key={assignment.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">
                                {assignment.application?.startupName ||
                                  "Unnamed Startup"}
                              </CardTitle>
                              <CardDescription>
                                {assignment.application?.call?.title ||
                                  "Untitled Call"}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(assignment.status)}
                              {assignment.dueDate && (
                                <div className="text-xs flex items-center">
                                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span>
                                    Due: {formatDate(assignment.dueDate)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Industry:
                              </span>
                              <span className="ml-2">
                                {assignment.application?.industry || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Stage:
                              </span>
                              <span className="ml-2">
                                {assignment.application?.stage || "N/A"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              router.push(`/reviewer/review/${assignment.id}`)
                            }
                          >
                            {assignment.status === "COMPLETED"
                              ? "View Review"
                              : "Start Review"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
}
