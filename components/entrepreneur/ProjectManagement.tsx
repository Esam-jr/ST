import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { BudgetDashboard } from "@/components/admin/budget/BudgetDashboard";
import { BudgetExpenses } from "@/components/admin/budget/BudgetExpenses";

interface Project {
  id: string;
  startupCallId: string;
  startupCallTitle: string;
  budget: {
    id: string;
    totalAmount: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
  timeline: {
    milestones: Array<{
      id: string;
      title: string;
      dueDate: string;
      status: "pending" | "in_progress" | "completed";
    }>;
  };
}

export default function ProjectManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get("/api/entrepreneur/project");
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No active project found</p>
      </div>
    );
  }

  return (
    <BudgetProvider>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>
                Track your allocated budget and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Budget
                  </span>
                  <span className="font-medium">
                    ${project.budget.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Spent</span>
                  <span className="font-medium">
                    ${project.budget.spent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Remaining
                  </span>
                  <span className="font-medium">
                    ${project.budget.remaining.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (project.budget.spent / project.budget.totalAmount) * 100
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Task Management */}
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Track your project milestones and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Tasks
                  </span>
                  <span className="font-medium">{project.tasks.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="font-medium">{project.tasks.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium">{project.tasks.pending}</span>
                </div>
                <Progress
                  value={(project.tasks.completed / project.tasks.total) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>
              View and manage your project milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.timeline.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      milestone.status === "completed"
                        ? "default"
                        : milestone.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {milestone.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
            <CardDescription>
              Detailed view of your budget and expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetDashboard
              startupCallId={project.startupCallId}
              budgets={[project.budget]}
            />
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              Track and manage your project expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetExpenses
              startupCallId={project.startupCallId}
              budgets={[project.budget]}
            />
          </CardContent>
        </Card>
      </div>
    </BudgetProvider>
  );
}
