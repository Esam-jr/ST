import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';

type TasksListProps = {
  userId?: string;
};

// Mock data for demo purposes
const mockTasks = [
  {
    id: '1',
    title: 'Complete pitch deck',
    description: 'Finalize the pitch deck for the investor meeting',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2025-04-18T10:00:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '2',
    title: 'Update financial projections',
    description: 'Revise the 5-year financial projections based on recent market analysis',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2025-04-25T14:30:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '3',
    title: 'Prepare for demo day',
    description: 'Create a product demonstration for the upcoming demo day',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2025-04-30T09:00:00Z',
    startupId: '2',
    startupName: 'HealthTech Innovations',
    assigneeId: 'user1',
  },
  {
    id: '4',
    title: 'Schedule customer interviews',
    description: 'Set up interviews with potential customers for market validation',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: '2025-04-10T11:00:00Z',
    startupId: '1',
    startupName: 'EcoTech Solutions',
    assigneeId: 'user1',
  },
  {
    id: '5',
    title: 'Review competitor analysis',
    description: 'Review and update the competitor analysis document',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2025-04-20T16:00:00Z',
    startupId: '2',
    startupName: 'HealthTech Innovations',
    assigneeId: 'user1',
  },
];

export default function TasksList({ userId }: TasksListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch tasks from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Filter tasks by assignee
      const filteredTasks = userId ? mockTasks.filter(task => task.assigneeId === userId) : mockTasks;
      
      // Sort tasks by priority and due date
      const sortedTasks = [...filteredTasks].sort((a, b) => {
        // First sort by status (TODO and IN_PROGRESS before COMPLETED)
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        
        // Then sort by priority
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // Finally sort by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      setTasks(sortedTasks);
      setIsLoading(false);
    }, 800);
  }, [userId]);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'TODO':
        return <Circle className="h-5 w-5 text-secondary" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = (dateString: string, status: string) => {
    if (status === 'COMPLETED') return false;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border-b pb-4 border-border">
              <div className="mb-2 h-4 w-1/4 rounded bg-muted"></div>
              <div className="mb-2 h-3 w-3/4 rounded bg-muted"></div>
              <div className="flex justify-between">
                <div className="h-3 w-1/5 rounded bg-muted"></div>
                <div className="h-3 w-1/5 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No tasks found</CardTitle>
          <CardDescription>
            You don't have any tasks assigned to you at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Your Tasks</CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/tasks">
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-1">
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="mr-4">
                {getStatusIcon(task.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">
                    {task.title}
                  </h4>
                  <Badge variant={getPriorityVariant(task.priority) as any} className="ml-2">
                    {task.priority}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {task.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <Link href={`/startups/${task.startupId}`} className="text-sm text-primary hover:underline">
                    {task.startupName}
                  </Link>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span className={`text-xs ${isOverdue(task.dueDate, task.status) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {formatDueDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
