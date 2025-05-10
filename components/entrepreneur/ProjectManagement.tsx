import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectData {
  id: string;
  startupCall: {
    id: string;
    title: string;
    description: string;
  };
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }>;
}

export default function ProjectManagement() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch("/api/entrepreneur/project");
        if (response.ok) {
          const data = await response.json();
          setProjectData(data);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!projectData) {
    return <div>No active project found.</div>;
  }

  const budgetProgress =
    (projectData.budget.spent / projectData.budget.total) * 100;
  const taskProgress =
    (projectData.tasks.completed / projectData.tasks.total) * 100;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-2xl font-semibold">
                      ${projectData.budget.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Spent</p>
                    <p className="text-2xl font-semibold">
                      ${projectData.budget.spent}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-2xl font-semibold">
                      ${projectData.budget.remaining}
                    </p>
                  </div>
                </div>
                <Progress value={budgetProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Task Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-semibold">
                      {projectData.tasks.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold">
                      {projectData.tasks.completed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-semibold">
                      {projectData.tasks.pending}
                    </p>
                  </div>
                </div>
                <Progress value={taskProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Timeline Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectData.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-medium">{milestone.title}</h3>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        milestone.status === "COMPLETED"
                          ? "success"
                          : milestone.status === "IN_PROGRESS"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Budget details content will be added here */}
              <p>Budget details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Task management content will be added here */}
              <p>Task management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timeline content will be added here */}
              <p>Timeline details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
