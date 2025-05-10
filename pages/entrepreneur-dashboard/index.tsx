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
  Plus,
  FileText,
  Building,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Activity,
  LayoutDashboard,
  Briefcase,
  Target,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProjectManagement from "@/components/entrepreneur/ProjectManagement";
import { DashboardSidebar } from "@/components/entrepreneur/DashboardSidebar";
import { StartupCallApplicationStatus } from "@prisma/client";

// Define types
type CallStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

interface StartupCall {
  id: string;
  title?: string;
  description?: string;
  status: CallStatus;
  applicationDeadline?: string;
  publishedDate?: string;
  industry?: string;
  location?: string;
  fundingAmount?: string;
  applicationStatus?: ApplicationStatus;
  call?: {
    id: string;
    title: string;
    status: string;
    applicationDeadline: string;
    industry: string;
    location: string;
    fundingAmount: string;
  };
}

interface Application {
  id: string;
  startupName: string;
  industry: string;
  stage: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  reviewsCompleted: number;
  reviewsTotal: number;
  call: {
    id: string;
    title: string;
    status: CallStatus;
    applicationDeadline: string;
    industry: string;
    location: string;
    fundingAmount?: string;
  };
}

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState<Application[]>([]);
  const [openCalls, setOpenCalls] = useState<StartupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveProject, setHasActiveProject] = useState(false);
  const { toast } = useToast();

  // Redirect if not authenticated or not entrepreneur
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the entrepreneur dashboard",
        variant: "default",
      });
      router.push("/auth/signin?callbackUrl=/entrepreneur-dashboard");
      return;
    }

    if (session?.user?.role !== "ENTREPRENEUR") {
      toast({
        title: "Access Denied",
        description: "Only entrepreneurs can access this dashboard",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }
  }, [sessionStatus, session, router, toast]);

  // Fetch applications, open calls, and check for active project
  useEffect(() => {
    if (
      sessionStatus !== "authenticated" ||
      session?.user?.role !== "ENTREPRENEUR"
    )
      return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the user's applications
        const applicationsResponse = await axios.get(
          "/api/applications/my-applications"
        );
        setApplications(applicationsResponse.data);

        // Fetch open startup calls
        const callsResponse = await axios.get(
          "/api/startup-calls?status=PUBLISHED"
        );
        setOpenCalls(callsResponse.data);

        // Check for active project
        try {
          await axios.get("/api/entrepreneur/project");
          setHasActiveProject(true);
        } catch (error) {
          setHasActiveProject(false);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50">
            Submitted
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-50">
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
          <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50">
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout title="Entrepreneur Dashboard | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const hasApprovedApplication = applications.some(
    (app) => app.status === StartupCallApplicationStatus.APPROVED
  );

  return (
    <Layout title="Entrepreneur Dashboard">
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Entrepreneur Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your startup applications and track your progress
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <DashboardSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showProjectManagement={hasApprovedApplication}
            />

            {/* Main Content */}
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {applications.length === 0 ? (
                        <p className="text-gray-500">No applications yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((application) => (
                            <div
                              key={application.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">
                                    {application.startupName}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Submitted on{" "}
                                    {new Date(
                                      application.submittedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    application.status ===
                                    StartupCallApplicationStatus.APPROVED
                                      ? "success"
                                      : application.status ===
                                        StartupCallApplicationStatus.REJECTED
                                      ? "destructive"
                                      : "default"
                                  }
                                >
                                  {application.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Open Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {openCalls.length === 0 ? (
                        <p className="text-gray-500">
                          No open opportunities at the moment.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {openCalls.map((call) => (
                            <div
                              key={call.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{call.title}</h3>
                                  <p className="text-sm text-gray-500">
                                    Deadline:{" "}
                                    {new Date(
                                      call.applicationDeadline
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                {call.applicationStatus ? (
                                  <Badge
                                    variant={
                                      call.applicationStatus ===
                                      StartupCallApplicationStatus.APPROVED
                                        ? "success"
                                        : call.applicationStatus ===
                                          StartupCallApplicationStatus.REJECTED
                                        ? "destructive"
                                        : "default"
                                    }
                                  >
                                    {call.applicationStatus}
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/startup-calls/${call.id}/apply`
                                      )
                                    }
                                  >
                                    Apply Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {hasApprovedApplication && (
                  <TabsContent value="project-management">
                    <div className="space-y-4">
                      {/* Project Management content will be rendered here */}
                      <p>Project Management content</p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
