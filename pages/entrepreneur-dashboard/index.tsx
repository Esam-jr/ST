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
  const [activeView, setActiveView] = useState("overview");
  const [applications, setApplications] = useState<Application[]>([]);
  const [openCalls, setOpenCalls] = useState<StartupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveProject, setHasActiveProject] = useState(false);
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        // Fetch open startup calls - only non-expired and published
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

        // Check for active project - looking for approved applications
        try {
          // First check if the entrepreneur has any approved applications
          const hasApprovedApp = applicationsResponse.data.some(
            (app) => app.status === "APPROVED"
          );

          if (hasApprovedApp) {
            // If there's an approved application, try to get the project data
            await axios.get("/api/entrepreneur/project");

            // Check if the hasActiveProject was previously false and is now true
            if (!hasActiveProject) {
              // Only show notification if this is a change in status
              toast({
                title: "Project Management Available",
                description:
                  "Your startup was approved! Project management tools are now available.",
                variant: "default",
              });
            }

            setHasActiveProject(true);
          } else {
            // No approved applications found
            setHasActiveProject(false);
          }
        } catch (error) {
          console.error("No active project found:", error);
          setHasActiveProject(false);
        }
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
              activeView={activeView}
              setActiveView={setActiveView}
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
                      variant={activeView === "overview" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView("overview");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Overview
                    </Button>
                    <Button
                      variant={
                        activeView === "applications" ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView("applications");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Applications
                    </Button>
                    <Button
                      variant={
                        activeView === "opportunities" ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveView("opportunities");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Opportunities
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
                            activeView === "project-management"
                              ? "default"
                              : "ghost"
                          }
                          className={`w-full justify-start ${
                            activeView === "project-management"
                              ? "bg-primary text-primary-foreground"
                              : "border border-green-200 bg-green-50 text-green-700"
                          }`}
                          onClick={() => {
                            setActiveView("project-management");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Project Management
                        </Button>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              {activeView === "overview" && (
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
                            onClick={() => setActiveView("applications")}
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
                                <div className="font-medium">{call.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {call.industry} • {call.location}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {call.applicationDeadline && (
                                  <div className="text-xs text-amber-500 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {getDaysLeft(call.applicationDeadline)} days
                                    left
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
                          onClick={() => setActiveView("applications")}
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
              )}

              {activeView === "applications" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">My Applications</h2>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/startup-calls")}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      New Application
                    </Button>
                  </div>

                  {applications.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">
                          No Applications Found
                        </h3>
                        <p className="mt-2 text-muted-foreground max-w-md">
                          You haven't applied to any startup calls yet. Browse
                          available calls to find opportunities for your
                          startup.
                        </p>
                        <Button
                          className="mt-6"
                          onClick={() => router.push("/startup-calls")}
                        >
                          Browse Open Calls
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <Card key={app.id}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl">
                                    {app.startupName}
                                  </CardTitle>
                                  {getStatusBadge(app.status)}
                                </div>
                                <CardDescription className="mt-1 max-w-3xl">
                                  {app.industry && `${app.industry}`} •{" "}
                                  {app.stage && `${app.stage}`}
                                </CardDescription>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Submitted on {formatDate(app.submittedAt)}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className="mt-2">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Applied to:
                              </h4>
                              <p className="font-medium">{app.call.title}</p>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {app.call.industry} • {app.call.location}
                                {app.call.fundingAmount &&
                                  ` • Funding: ${app.call.fundingAmount}`}
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">
                                  Review progress
                                </span>
                                <span>
                                  {app.reviewsCompleted} of {app.reviewsTotal}{" "}
                                  reviews
                                </span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${
                                      (app.reviewsCompleted /
                                        app.reviewsTotal) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                router.push(`/startup-calls/${app.call.id}`)
                              }
                            >
                              View Call
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(`/applications/${app.id}`)
                              }
                            >
                              View Application
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === "opportunities" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      Open Opportunities
                    </h2>
                    <Button onClick={() => router.push("/startup-calls")}>
                      View All Calls
                    </Button>
                  </div>

                  {openCalls.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-16 w-16 text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">
                          No Open Calls
                        </h3>
                        <p className="mt-2 text-muted-foreground max-w-md">
                          There are no startup calls accepting applications at
                          the moment. Check back later for new opportunities.
                        </p>
                        <Button
                          className="mt-6"
                          variant="outline"
                          onClick={() => router.push("/startup-calls")}
                        >
                          View All Calls
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {openCalls.map((call) => (
                        <Card key={call.id}>
                          <CardHeader>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-xl">
                                  {call.title}
                                </CardTitle>
                                <CardDescription className="mt-1 max-w-3xl">
                                  {call.industry && `${call.industry}`}
                                  {call.location && call.industry
                                    ? ` • ${call.location}`
                                    : call.location}
                                  {call.fundingAmount &&
                                    (call.industry || call.location
                                      ? ` • Funding: ${call.fundingAmount}`
                                      : `Funding: ${call.fundingAmount}`)}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            {call.description && (
                              <p className="line-clamp-3 text-sm text-muted-foreground">
                                {call.description}
                              </p>
                            )}

                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                              {call.publishedDate && (
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="mr-1.5 h-4 w-4" />
                                  <span>
                                    Published: {formatDate(call.publishedDate)}
                                  </span>
                                </div>
                              )}

                              {call.applicationDeadline && (
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="mr-1.5 h-4 w-4" />
                                  <span>
                                    Deadline:{" "}
                                    {formatDate(call.applicationDeadline)}
                                  </span>
                                </div>
                              )}

                              {call.applicationDeadline && (
                                <div className="flex items-center text-amber-500">
                                  <Clock className="mr-1.5 h-4 w-4" />
                                  <span>
                                    {getDaysLeft(call.applicationDeadline)} days
                                    left
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>

                          <CardFooter className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                router.push(`/startup-calls/${call.id}`)
                              }
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(`/startup-calls/${call.id}/apply`)
                              }
                            >
                              Apply Now
                              <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === "project-management" && <ProjectManagement />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
