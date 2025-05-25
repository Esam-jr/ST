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
  Menu,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProjectManagement from "@/components/entrepreneur/ProjectManagement";
import DashboardSidebar from "@/components/entrepreneur/DashboardSidebar";
import ExpenseTracker from "@/components/entrepreneur/ExpenseTracker";
import IdeasManagement from "@/components/entrepreneur/IdeasManagement";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [startup, setStartup] = useState<any>(null);

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
      let hasErrors = false;

      try {
        // Fetch the user's applications
        const applicationsResponse = await axios
          .get("/api/applications/my-applications")
          .catch((error) => {
            console.error("Error fetching applications:", error);
            toast({
              title: "Error",
              description: "Failed to load your applications",
              variant: "destructive",
            });
            hasErrors = true;
            return { data: [] };
          });

        setApplications(applicationsResponse.data);

        // Check for approved applications
        const approvedApplication = applicationsResponse.data.find(
          (app: any) => app.status === "APPROVED"
        );

        if (approvedApplication) {
          try {
            // Get project data for the approved application
            const projectResponse = await axios.get(`/api/entrepreneur/project?startupId=${approvedApplication.startupId}`);
            const projectData = projectResponse.data;
            setStartup({
              id: projectData.id,
              ...projectData
            });
            setHasActiveProject(true);

            // Only show notification if this is a new approval
            if (!hasActiveProject) {
              toast({
                title: "Project Management Available",
                description:
                  "Your startup was approved! Project management tools are now available.",
                variant: "default",
              });
            }
          } catch (error) {
            console.error("Error fetching project data:", error);
            setHasActiveProject(false);
            setStartup(null);
            
            if (axios.isAxiosError(error)) {
              const errorCode = error.response?.data?.code;
              const errorMessage = error.response?.data?.message;
              
              if (error.response?.status === 404) {
                if (errorCode === "NO_APPROVED_APPLICATIONS") {
                  console.log("No approved applications found");
                } else if (errorCode === "STARTUP_NOT_FOUND") {
                  console.error("Startup not found");
                  toast({
                    title: "Error",
                    description: "Could not find your startup. Please try again later.",
                    variant: "destructive",
                  });
                } else if (errorCode === "BUDGET_NOT_FOUND") {
                  console.error("Budget not found");
                  toast({
                    title: "Error",
                    description: "Project budget not set up. Please contact support.",
                    variant: "destructive",
                  });
                }
              } else {
                toast({
                  title: "Error",
                  description: errorMessage || "Failed to load project data. Please try again later.",
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Error",
                description: "Failed to load project data. Please try again later.",
                variant: "destructive",
              });
            }
          }
        } else {
          setHasActiveProject(false);
          setStartup(null);
        }

        // Fetch open startup calls
        const callsResponse = await axios
          .get("/api/startup-calls?status=PUBLISHED&expired=false")
          .catch((error) => {
            console.error("Error fetching startup calls:", error);
            toast({
              title: "Error",
              description: "Failed to load open opportunities",
              variant: "destructive",
            });
            hasErrors = true;
            return { data: [] };
          });

        setOpenCalls(callsResponse.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
        hasErrors = true;
      } finally {
        setLoading(false);
        if (hasErrors) {
          toast({
            title: "Warning",
            description:
              "Some data may be incomplete. Please refresh to try again.",
            variant: "default",
          });
        }
      }
    };

    fetchData();
  }, [sessionStatus, session, toast, hasActiveProject]);

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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <DashboardStats userRole="ENTREPRENEUR" />
            {hasActiveProject && startup && (
              <div className="mt-8">
                <ProjectManagement startupId={startup.id} />
              </div>
            )}
          </>
        );
      case "applications":
        return (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>
                Track the status of your startup call applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    No applications yet
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/startup-calls")}
                  >
                    Browse Open Calls
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col md:flex-row items-start justify-between gap-4 p-4 border border-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-lg">
                          {app.startupName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {app.call.title} • {app.industry} •{" "}
                          {app.stage}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Submitted on {formatDate(app.submittedAt)}
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(app.status)}
                          <div className="text-xs text-muted-foreground">
                            Reviews: {app.reviewsCompleted}/
                            {app.reviewsTotal}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={() =>
                            router.push(`/applications/${app.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case "opportunities":
        return (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Startup Opportunities</CardTitle>
              <CardDescription>
                Discover open startup calls and submit your applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openCalls.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    No open calls at the moment
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/startup-calls")}
                  >
                    Check All Calls
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {openCalls.map((call) => (
                    <div
                      key={call.id}
                      className="flex flex-col md:flex-row items-start justify-between gap-4 p-4 border border-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-lg">
                          {call.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {call.industry} • {call.location} •{" "}
                          {call.fundingAmount &&
                            `Funding: ${call.fundingAmount}`}
                        </div>
                        {call.applicationDeadline && (
                          <div className="text-xs text-amber-500 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Deadline:{" "}
                            {formatDate(call.applicationDeadline)} (
                            {getDaysLeft(call.applicationDeadline)} days
                            left)
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                        <Button
                          size="sm"
                          className="w-full md:w-auto"
                          onClick={() =>
                            router.push(`/startup-calls/${call.id}`)
                          }
                        >
                          Apply Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={() =>
                            router.push(`/startup-calls/${call.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                onClick={() => router.push("/startup-calls")}
                className="gap-2"
              >
                View All Startup Calls
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      case "expenses":
        if (!hasActiveProject || !startup) {
          return (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>
                  You need an approved application to access expense management.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <ExpenseTracker startupId={startup.id} />;
      case "ideas":
        return <IdeasManagement />;
      case "project":
        if (!hasActiveProject || !startup) {
          return (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  You need an approved application to access project management.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <ProjectManagement startupId={startup.id} />;
      default:
        return null;
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

  return (
    <Layout title="Entrepreneur Dashboard">
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Entrepreneur Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your startup applications and track your progress
                </p>
              </div>
              <button
                className="md:hidden p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <DashboardSidebar
              activeView={activeTab}
              setActiveView={setActiveTab}
              hasActiveProject={hasActiveProject}
            />

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-40 md:hidden">
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                ></div>
                <div className="fixed top-[73px] left-0 bottom-0 w-64 bg-background p-4 shadow-lg">
                  <nav className="space-y-2">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("overview");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Overview
                    </Button>
                    <Button
                      variant={
                        activeTab === "applications" ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("applications");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Applications
                    </Button>
                    <Button
                      variant={
                        activeTab === "opportunities" ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("opportunities");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Opportunities
                    </Button>
                    <Button
                      variant={activeTab === "ideas" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("ideas");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      My Ideas
                    </Button>

                    {hasActiveProject && (
                      <>
                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-muted"></div>
                          </div>
                        </div>

                        <div className="py-1">
                          <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Approved Startup</span>
                          </div>
                        </div>

                        <Button
                          variant={
                            activeTab === "project" ? "default" : "ghost"
                          }
                          className={`w-full justify-start ${
                            activeTab === "project"
                              ? "bg-primary text-primary-foreground"
                              : "border border-green-200 bg-green-50 text-green-700"
                          }`}
                          onClick={() => {
                            setActiveTab("project");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Project Management
                        </Button>
                        <Button
                          variant={
                            activeTab === "expenses" ? "default" : "ghost"
                          }
                          className={`w-full justify-start ${
                            activeTab === "expenses"
                              ? "bg-primary text-primary-foreground"
                              : "border border-green-200 bg-green-50 text-green-700"
                          }`}
                          onClick={() => {
                            setActiveTab("expenses");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Expense Tracker
                        </Button>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  // Only allow setting tabs that are available
                  if (
                    !hasActiveProject &&
                    (value === "project" || value === "expenses")
                  ) {
                    toast({
                      title: "Access Restricted",
                      description:
                        "Project and expense management is only available after approval.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setActiveTab(value);
                }}
              >
                {hasActiveProject ? (
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                    <TabsTrigger value="project">Project</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  </TabsList>
                ) : (
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                    <TabsTrigger value="ideas">My Ideas</TabsTrigger>
                  </TabsList>
                )}

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-8">
                    <div className="w-full mb-2">
                      <DashboardStats userRole="ENTREPRENEUR" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Recent Applications */}
                      <Card className="shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle>Recent Applications</CardTitle>
                          <CardDescription>
                            Your most recent startup call applications
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {applications.length === 0 ? (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                              <p className="mt-2 text-muted-foreground">
                                No applications yet
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push("/startup-calls")}
                              >
                                Browse Open Calls
                              </Button>
                            </div>
                          ) : (
                            applications.slice(0, 3).map((app) => (
                              <div
                                key={app.id}
                                className="flex items-start justify-between border-b border-muted pb-4 last:border-0 last:pb-0"
                              >
                                <div>
                                  <div className="font-medium">
                                    {app.startupName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {app.call.title} •{" "}
                                    {formatDate(app.submittedAt)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {getStatusBadge(app.status)}
                                  <div className="text-xs text-muted-foreground">
                                    Reviews: {app.reviewsCompleted}/
                                    {app.reviewsTotal}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                        {applications.length > 0 && (
                          <CardFooter className="pt-0 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("applications")}
                            >
                              View All Applications
                              <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        )}
                      </Card>

                      {/* Open Opportunities */}
                      <Card className="shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle>Open Opportunities</CardTitle>
                          <CardDescription>
                            Startup calls accepting applications
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {openCalls.length === 0 ? (
                            <div className="text-center py-8">
                              <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                              <p className="mt-2 text-muted-foreground">
                                No open calls at the moment
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push("/startup-calls")}
                              >
                                Check All Calls
                              </Button>
                            </div>
                          ) : (
                            openCalls.slice(0, 3).map((call) => (
                              <div
                                key={call.id}
                                className="flex items-start justify-between border-b border-muted pb-4 last:border-0 last:pb-0"
                              >
                                <div>
                                  <div className="font-medium">
                                    {call.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {call.industry} • {call.location}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {call.applicationDeadline && (
                                    <div className="text-xs text-amber-500 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {getDaysLeft(
                                        call.applicationDeadline
                                      )}{" "}
                                      days left
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      router.push(`/startup-calls/${call.id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                        {openCalls.length > 0 && (
                          <CardFooter className="pt-0 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push("/startup-calls")}
                            >
                              View All Opportunities
                              <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Button
                            variant="outline"
                            className="h-auto flex-col items-center justify-center py-6 space-y-2"
                            onClick={() => router.push("/startup-calls")}
                          >
                            <PlusCircle className="h-6 w-6" />
                            <span>Apply to Call</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto flex-col items-center justify-center py-6 space-y-2"
                            onClick={() => setActiveTab("applications")}
                          >
                            <FileText className="h-6 w-6" />
                            <span>View Applications</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto flex-col items-center justify-center py-6 space-y-2"
                            onClick={() => router.push("/profile")}
                          >
                            <Building className="h-6 w-6" />
                            <span>Update Profile</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-auto flex-col items-center justify-center py-6 space-y-2"
                            onClick={() => router.push("/dashboard")}
                          >
                            <Activity className="h-6 w-6" />
                            <span>View Analytics</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="applications" className="mt-6">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>My Applications</CardTitle>
                      <CardDescription>
                        Track the status of your startup call applications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {applications.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                          <p className="mt-2 text-muted-foreground">
                            No applications yet
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push("/startup-calls")}
                          >
                            Browse Open Calls
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((app) => (
                            <div
                              key={app.id}
                              className="flex flex-col md:flex-row items-start justify-between gap-4 p-4 border border-muted rounded-lg"
                            >
                              <div>
                                <div className="font-medium text-lg">
                                  {app.startupName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {app.call.title} • {app.industry} •{" "}
                                  {app.stage}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Submitted on {formatDate(app.submittedAt)}
                                </div>
                              </div>
                              <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(app.status)}
                                  <div className="text-xs text-muted-foreground">
                                    Reviews: {app.reviewsCompleted}/
                                    {app.reviewsTotal}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full md:w-auto"
                                  onClick={() =>
                                    router.push(`/applications/${app.id}`)
                                  }
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="opportunities" className="mt-6">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>Startup Opportunities</CardTitle>
                      <CardDescription>
                        Discover open startup calls and submit your applications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {openCalls.length === 0 ? (
                        <div className="text-center py-8">
                          <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                          <p className="mt-2 text-muted-foreground">
                            No open calls at the moment
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push("/startup-calls")}
                          >
                            Check All Calls
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {openCalls.map((call) => (
                            <div
                              key={call.id}
                              className="flex flex-col md:flex-row items-start justify-between gap-4 p-4 border border-muted rounded-lg"
                            >
                              <div>
                                <div className="font-medium text-lg">
                                  {call.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {call.industry} • {call.location} •{" "}
                                  {call.fundingAmount &&
                                    `Funding: ${call.fundingAmount}`}
                                </div>
                                {call.applicationDeadline && (
                                  <div className="text-xs text-amber-500 mt-1 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Deadline:{" "}
                                    {formatDate(call.applicationDeadline)} (
                                    {getDaysLeft(call.applicationDeadline)} days
                                    left)
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                                <Button
                                  size="sm"
                                  className="w-full md:w-auto"
                                  onClick={() =>
                                    router.push(`/startup-calls/${call.id}`)
                                  }
                                >
                                  Apply Now
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full md:w-auto"
                                  onClick={() =>
                                    router.push(`/startup-calls/${call.id}`)
                                  }
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="justify-center">
                      <Button
                        onClick={() => router.push("/startup-calls")}
                        className="gap-2"
                      >
                        View All Startup Calls
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="ideas" className="mt-6">
                  <IdeasManagement />
                </TabsContent>

                {hasActiveProject && (
                  <>
                    <TabsContent value="project" className="mt-6">
                      <ProjectManagement startupId={startup.id} />
                    </TabsContent>

                    <TabsContent value="expenses" className="mt-6">
                      <ExpenseTracker startupId={startup.id} />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}