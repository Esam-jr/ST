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
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

// Define types
type ReviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

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
    if (sessionStatus !== "authenticated" || session?.user?.role !== "REVIEWER")
      return;

    const fetchAssignments = async () => {
      setLoading(true);
      try {
        // This endpoint needs to be created
        const response = await axios.get("/api/reviewer/assignments");
        setAssignments(response.data);
      } catch (error) {
        console.error("Error fetching review assignments:", error);
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
  }, [sessionStatus, session, toast]);

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
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50">
            Pending
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">
            In Progress
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-50 text-green-600 hover:bg-green-50">
            Completed
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50">
            Overdue
          </Badge>
        );
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
    <Layout title="Reviewer Dashboard">
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

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            <TabsList>
              <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {
                          assignments.filter((a) =>
                            ["PENDING", "IN_PROGRESS"].includes(a.status)
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pending Reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          assignments.filter((a) => a.status === "COMPLETED")
                            .length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Completed Reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {
                          assignments.filter((a) => a.status === "OVERDUE")
                            .length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overdue Reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignments List */}
              {filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">
                      No Reviews Found
                    </h3>
                    <p className="mt-2 text-muted-foreground max-w-md">
                      {activeTab === "pending"
                        ? "You don't have any pending reviews at the moment."
                        : activeTab === "completed"
                        ? "You haven't completed any reviews yet."
                        : "You don't have any overdue reviews."}
                    </p>
                  </CardContent>
                </Card>
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
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}
