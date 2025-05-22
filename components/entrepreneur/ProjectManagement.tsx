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
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  Clock4,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertOctagon,
} from "lucide-react";
import CreateTaskDialog from "../dialogs/CreateTaskDialog";
import CreateMilestoneDialog from "../dialogs/CreateMilestoneDialog";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  startDate: string;
  completedDate?: string;
  assignee?: {
    id: string;
    name: string;
    image?: string;
  };
  milestone?: {
    id: string;
    title: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

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
      status: string;
    }>;
  };
}

export default function ProjectManagement() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
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

  const fetchTasks = async () => {
    if (!project) return;
    
    try {
      setTasksLoading(true);
      const response = await axios.get(`/api/startups/${project.id}/tasks`);
      setTasks(response.data);
    } catch (error: any) {
      console.error("Error fetching tasks data:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks data",
        variant: "destructive",
      });
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [toast]);

  useEffect(() => {
    if (project) {
      fetchTasks();
    }
  }, [project]);

  // Handle task status update
  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/startups/${project?.id}/tasks`, {
        taskId,
        status: newStatus
      });
      
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      
      // Refresh tasks
      fetchTasks();
      // Also refresh project data to update summary stats
      fetchProject();
    } catch (error: any) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  // Format priority for display
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 flex items-center gap-1">
            <ArrowUpCircle className="h-3 w-3" />
            High
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 flex items-center gap-1">
            <Clock4 className="h-3 w-3" />
            Medium
          </Badge>
        );
      case 'LOW':
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 flex items-center gap-1">
            <ArrowDownCircle className="h-3 w-3" />
            Low
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600">
            {priority}
          </Badge>
        );
    }
  };

  // Format status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return (
          <Badge className="bg-gray-50 text-gray-600">
            To Do
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-50 text-blue-600">
            In Progress
          </Badge>
        );
      case 'BLOCKED':
        return (
          <Badge className="bg-red-50 text-red-600 flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" />
            Blocked
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-green-50 text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card className="border-red-200 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 opacity-80" />
          <h3 className="mt-4 text-lg font-medium">Project Not Found</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            {error ||
              "No project data is available for your startup right now."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate budget percentages with error handling
  const spentPercentage =
    project.budget.totalAmount > 0
      ? (project.budget.spent / project.budget.totalAmount) * 100
      : 0;
  const remainingPercentage = 100 - spentPercentage;

  // Format currency with error handling
  const formatCurrency = (amount: number) => {
    try {
      return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "$0.00";
    }
  };

  // Calculate category percentage with error handling
  const calculateCategoryPercentage = (spent: number, allocated: number) => {
    if (allocated <= 0) return 0;
    try {
      return (spent / allocated) * 100;
    } catch (error) {
      console.error("Error calculating category percentage:", error);
      return 0;
    }
  };

  // Format date with error handling
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Calculate if a milestone is overdue with error handling
  const isOverdue = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      return date < today;
    } catch (error) {
      console.error("Error checking if milestone is overdue:", error);
      return false;
    }
  };

  // Handler for when a new task is created
  const handleTaskCreated = () => {
    toast({
      title: "Success",
      description: "Task has been created successfully",
    });
    fetchProject(); // Refresh project data
    fetchTasks();   // Refresh tasks data
  };

  // Handler for when a new milestone is created
  const handleMilestoneCreated = () => {
    toast({
      title: "Success",
      description: "Milestone has been created successfully",
    });
    fetchProject(); // Refresh data
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Project Management</h2>
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          {project.startupCallTitle}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-1.5 text-green-600" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-medium">
                  {formatCurrency(project.budget.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium text-amber-600">
                  {formatCurrency(project.budget.spent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(project.budget.remaining)}
                </span>
              </div>
              <Progress value={spentPercentage} className="h-2 mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Spent: {spentPercentage.toFixed(1)}%</span>
                <span>Remaining: {remainingPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Management */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-1.5 text-blue-600" />
              Task Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tasks</span>
                <span className="font-medium">{project.tasks.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">
                  {project.tasks.completed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-amber-600">
                  {project.tasks.pending}
                </span>
              </div>
              {project.tasks.total > 0 && (
                <>
                  <Progress
                    value={
                      (project.tasks.completed / project.tasks.total) * 100
                    }
                    className="h-2 mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Progress:{" "}
                      {(
                        (project.tasks.completed / project.tasks.total) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    <span>
                      {project.tasks.completed} of {project.tasks.total}{" "}
                      completed
                    </span>
                  </div>
                </>
              )}
              <div className="mt-3">
                {project && (
                  <CreateTaskDialog
                    startupId={project.id}
                    onTaskCreated={handleTaskCreated}
                    trigger={
                      <Button size="sm" variant="outline" className="w-full">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Timeline */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-1.5 text-purple-600" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Milestones</span>
                <span className="font-medium">
                  {project.timeline.milestones.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">
                  {
                    project.timeline.milestones.filter(
                      (m) => m.status === "completed"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Upcoming</span>
                <span className="font-medium text-amber-600">
                  {
                    project.timeline.milestones.filter(
                      (m) => m.status !== "completed"
                    ).length
                  }
                </span>
              </div>
              {project.timeline.milestones.length > 0 && (
                <>
                  <Progress
                    value={
                      (project.timeline.milestones.filter(
                        (m) => m.status === "completed"
                      ).length /
                        project.timeline.milestones.length) *
                      100
                    }
                    className="h-2 mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Next milestone:{" "}
                    {project.timeline.milestones.find(
                      (m) => m.status !== "completed"
                    )?.title || "All completed!"}
                  </div>
                </>
              )}
              <div className="mt-3">
                {project && (
                  <CreateMilestoneDialog
                    startupId={project.id}
                    onMilestoneCreated={handleMilestoneCreated}
                    trigger={
                      <Button size="sm" variant="outline" className="w-full">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Milestone
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Dashboard */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Budget Dashboard</CardTitle>
          <CardDescription>
            Track your project spending and budget allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                  Budget Usage
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-green-600">
                  {spentPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
              <div
                style={{ width: `${spentPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Total Budget</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(project.budget.totalAmount)}
              </p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-muted-foreground">Call:</span>
                <span>{project.startupCallTitle}</span>
              </div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Current Spending</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(project.budget.spent)}
              </p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="text-green-600">
                  {formatCurrency(project.budget.remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Categories */}
          <div className="mt-6">
            <h3 className="font-medium mb-4">Budget Categories</h3>
            <div className="space-y-4">
              {project.budget.categories.map((category) => {
                const categorySpentPercentage = calculateCategoryPercentage(
                  category.spent,
                  category.allocatedAmount
                );
                return (
                  <div key={category.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{category.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {categorySpentPercentage.toFixed(1)}% spent
                      </span>
                    </div>
                    <Progress
                      value={categorySpentPercentage}
                      className="h-2 mb-2"
                    />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Allocated:
                        </span>
                        <span className="ml-2 font-medium">
                          {formatCurrency(category.allocatedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spent:</span>
                        <span className="ml-2 font-medium text-amber-600">
                          {formatCurrency(category.spent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Remaining:
                        </span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatCurrency(category.remaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="mt-6">
            <h3 className="font-medium mb-4">Recent Expenses</h3>
            <div className="space-y-2">
              {project.budget.expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(expense.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        expense.status === "APPROVED"
                          ? "bg-green-50 text-green-600"
                          : expense.status === "PENDING"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Milestones */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Timeline Milestones</CardTitle>
            {project && (
              <CreateMilestoneDialog
                startupId={project.id}
                onMilestoneCreated={handleMilestoneCreated}
                trigger={
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Milestone
                  </Button>
                }
              />
            )}
          </div>
          <CardDescription>
            Track your project milestones and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!project?.timeline.milestones.length ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">
                No milestones defined yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first milestone to start tracking progress
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.timeline.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{milestone.title}</h3>
                      {milestone.status === "completed" ? (
                        <Badge className="ml-2 bg-green-50 text-green-600 hover:bg-green-50">
                          Completed
                        </Badge>
                      ) : isOverdue(milestone.dueDate) ? (
                        <Badge className="ml-2 bg-red-50 text-red-600 hover:bg-red-50">
                          Overdue
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-amber-50 text-amber-600 hover:bg-amber-50">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due: {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                  {milestone.status !== "completed" &&
                    isOverdue(milestone.dueDate) && (
                      <div className="flex items-center text-red-500 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>
                          {Math.ceil(
                            (new Date().getTime() -
                              new Date(milestone.dueDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days overdue
                        </span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            {project && (
              <CreateTaskDialog
                startupId={project.id}
                onTaskCreated={handleTaskCreated}
                trigger={
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Task
                  </Button>
                }
              />
            )}
          </div>
          <CardDescription>
            Manage your project tasks and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!project || project.tasks.total === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">
                No tasks created yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first task to start tracking work items
              </p>
            </div>
          ) : tasksLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="mt-2 text-muted-foreground">
                Failed to load task details. Please refresh the page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Due: </span>
                      <span className="ml-1 font-medium">{formatDate(task.dueDate)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-muted-foreground">Assigned to: </span>
                      <span className="ml-1 font-medium">
                        {task.assignee ? task.assignee.name : "Unassigned"}
                      </span>
                    </div>
                    
                    {task.milestone && (
                      <div className="flex items-center col-span-2">
                        <span className="text-muted-foreground">Part of milestone: </span>
                        <span className="ml-1 font-medium">{task.milestone.title}</span>
                      </div>
                    )}
                  </div>
                  
                  {task.status !== "COMPLETED" && (
                    <div className="mt-4 flex justify-end gap-2">
                      {task.status === "TODO" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTaskStatusUpdate(task.id, "IN_PROGRESS")}
                        >
                          Start Task
                        </Button>
                      )}
                      
                      {task.status === "BLOCKED" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTaskStatusUpdate(task.id, "IN_PROGRESS")}
                        >
                          Unblock
                        </Button>
                      )}
                      
                      {task.status === "IN_PROGRESS" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleTaskStatusUpdate(task.id, "BLOCKED")}
                          >
                            Block
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleTaskStatusUpdate(task.id, "COMPLETED")}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            View and manage your project expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between py-4 text-center border-b">
            <div className="w-1/4">
              <p className="text-xl font-bold">
                {formatCurrency(project.budget.spent)}
              </p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <div className="w-1/4">
              <p className="text-xl font-bold">
                {formatCurrency(project.budget.remaining)}
              </p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
            <div className="w-1/4">
              <p className="text-xl font-bold">{spentPercentage.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Budget Used</p>
            </div>
            <div className="w-1/4">
              <p className="text-xl font-bold">
                {formatCurrency(project.budget.totalAmount)}
              </p>
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </div>
          </div>

          <div className="mt-6 text-center py-6">
            <p className="text-muted-foreground mb-4">
              For detailed expense tracking and management, please contact your
              project manager
            </p>
            <Button variant="outline">Contact Project Manager</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
