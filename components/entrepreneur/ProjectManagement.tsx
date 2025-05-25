import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  DollarSign,
  PlayCircle,
} from "lucide-react";
import CreateMilestoneDialog from "../dialogs/CreateMilestoneDialog";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string;
  startupCallId: string;
  startupCallTitle: string;
  budget: {
    id: string;
    totalAmount: number;
    spent: number;
    remaining: number;
    categories: Array<{
      id: string;
      name: string;
      allocatedAmount: number;
      spent: number;
      remaining: number;
    }>;
  };
  timeline: {
    milestones: Array<{
      id: string;
      title: string;
      description?: string;
      dueDate: string;
      status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
    }>;
  };
}

interface ProjectManagementProps {
  startupId: string;
}

export default function ProjectManagement({ startupId }: ProjectManagementProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/entrepreneur/project?startupId=${startupId}`);
      setProject(response.data);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching project data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load project data. Please try again later."
      );
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [startupId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProject();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min(Math.round((spent / allocated) * 100), 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  const handleMilestoneCreated = () => {
    toast({
      title: "Success",
      description: "Milestone created successfully",
    });
    fetchProject();
  };

  const handleMilestoneStatusUpdate = async (
    milestoneId: string, 
    newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED"
  ) => {
    try {
      await axios.patch(`/api/entrepreneur/milestones/${milestoneId}`, {
        status: newStatus,
      });
      
      toast({
        title: "Success",
        description: "Milestone status updated successfully",
      });
      
      fetchProject();
    } catch (error: any) {
      console.error("Error updating milestone status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update milestone status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h3 className="text-lg font-semibold">Error Loading Project</h3>
        <p className="text-muted-foreground max-w-md text-center">{error}</p>
        <Button variant="outline" onClick={handleRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h3 className="text-lg font-semibold">No Active Project</h3>
        <p className="text-muted-foreground">
          You don't have an active project at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Management</h2>
          <p className="text-muted-foreground">
            Managing: {project.startupCallTitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <CreateMilestoneDialog
            startupId={project.id}
            onMilestoneCreated={handleMilestoneCreated}
          />
        </div>
      </div>

      <Separator />

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Overview
          </CardTitle>
          <CardDescription>Track your project budget and expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">
                {formatCurrency(project.budget.totalAmount)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(project.budget.spent)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">
                {formatCurrency(project.budget.remaining)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Budget Categories</h4>
            {project.budget.categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {formatCurrency(category.spent)} /{" "}
                    {formatCurrency(category.allocatedAmount)}
                  </span>
                </div>
                <Progress
                  value={calculatePercentage(category.spent, category.allocatedAmount)}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {calculatePercentage(category.spent, category.allocatedAmount)}% spent
                  </span>
                  <span>
                    {formatCurrency(category.remaining)} remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Milestones
          </CardTitle>
          <CardDescription>
            Track your project milestones and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.timeline.milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-muted-foreground">No milestones yet</p>
            </div>
          ) : (
            project.timeline.milestones.map((milestone) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="font-medium">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span
                        className={
                          isOverdue(milestone.dueDate) &&
                          milestone.status !== "COMPLETED"
                            ? "text-red-500"
                            : ""
                        }
                      >
                        Due {formatDate(milestone.dueDate)}
                        {isOverdue(milestone.dueDate) &&
                          milestone.status !== "COMPLETED" &&
                          " (Overdue)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        milestone.status === "COMPLETED"
                          ? "secondary"
                          : milestone.status === "IN_PROGRESS"
                          ? "default"
                          : milestone.status === "DELAYED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {milestone.status === "COMPLETED" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {milestone.status === "IN_PROGRESS" && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {milestone.status}
                    </Badge>

                    {milestone.status !== "COMPLETED" && (
                      <div className="flex gap-2">
                        {milestone.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMilestoneStatusUpdate(milestone.id, "IN_PROGRESS")
                            }
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {milestone.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMilestoneStatusUpdate(milestone.id, "COMPLETED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}