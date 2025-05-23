import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  PlusCircle,
  PlayCircle,
} from "lucide-react";
import CreateMilestoneDialog from "../dialogs/CreateMilestoneDialog";

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
    expenses: Array<{
      id: string;
      title: string;
      amount: number;
      date: string;
      categoryId: string;
      status: string;
    }>;
  };
  timeline: {
    milestones: Array<{
      id: string;
      title: string;
      dueDate: string;
      status: string;
    }>;
  };
}

export default function ProjectManagement() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/entrepreneur/project");
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
    }
  };

  useEffect(() => {
    fetchProject();
  }, [toast]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage for budget categories
  const calculateCategoryPercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min(Math.round((spent / allocated) * 100), 100);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if date is overdue
  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  // Handle milestone creation
  const handleMilestoneCreated = () => {
    fetchProject();
    toast({
      title: "Success",
      description: "Milestone created successfully",
    });
  };

  // Add milestone status update handler
  const handleMilestoneStatusUpdate = async (milestoneId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/entrepreneur/milestones/${milestoneId}`, {
        status: newStatus,
      });
      
      toast({
        title: "Success",
        description: "Milestone status updated successfully",
      });
      
      // Refresh project data to show updated status
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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Project</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Project Found</h3>
          <p className="text-gray-600">
            You don't have an active project at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Management</h2>
          <p className="text-muted-foreground">
            Manage your startup project for {project.startupCallTitle}
          </p>
        </div>
        <CreateMilestoneDialog 
          startupId={project.id}
          onMilestoneCreated={handleMilestoneCreated} 
        />
      </div>

        {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
              Budget Overview
            </CardTitle>
          <CardDescription>Track your project budget and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.budget.totalAmount)}
            </div>
          </CardContent>
        </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spent</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.budget.spent)}
            </div>
          </CardContent>
        </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.budget.remaining)}
            </div>
          </CardContent>
        </Card>
      </div>

          <div className="mt-6 space-y-4">
            {project.budget.categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-500">
                    {formatCurrency(category.spent)} /{" "}
                    {formatCurrency(category.allocatedAmount)}
                      </span>
                    </div>
                    <Progress
                  value={calculateCategoryPercentage(
                    category.spent,
                    category.allocatedAmount
                  )}
                  className="h-2"
                />
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
          <CardDescription>Track your project milestones and progress</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {project.timeline.milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{milestone.title}</CardTitle>
                    <Badge
                      className={`${
                        milestone.status === "COMPLETED"
                          ? "bg-green-50 text-green-600"
                          : milestone.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {milestone.status === "COMPLETED" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {milestone.status === "IN_PROGRESS" && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {milestone.status}
                    </Badge>
                  </div>
        </CardHeader>
        <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
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
                      </span>
                    </div>
                    
                    {/* Status Update Actions */}
                    {milestone.status !== "COMPLETED" && (
                      <div className="flex items-center gap-2 mt-2">
                        {milestone.status === "PENDING" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleMilestoneStatusUpdate(milestone.id, "IN_PROGRESS")}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {milestone.status === "IN_PROGRESS" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleMilestoneStatusUpdate(milestone.id, "COMPLETED")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                      )}
                    </div>
                  )}
                </div>
        </CardContent>
      </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
