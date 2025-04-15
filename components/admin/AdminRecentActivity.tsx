import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  CircleCheck, 
  CircleX, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  ChevronRight 
} from 'lucide-react';

// Activity types
type ActivityType = 'user' | 'application' | 'review' | 'call' | 'system';

// Activity interface
interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'application':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'review':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'call':
      return <AlertCircle className="h-4 w-4 text-purple-500" />;
    case 'system':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const AdminRecentActivity: React.FC = () => {
  // Mock data for recent activities
  const activities: Activity[] = [
    {
      id: 'act-001',
      type: 'user',
      title: 'New User Registered',
      description: 'James Wilson registered as an entrepreneur',
      user: {
        name: 'James Wilson',
      },
      timestamp: new Date(Date.now() - 25 * 60000), // 25 minutes ago
    },
    {
      id: 'act-002',
      type: 'application',
      title: 'Application Submitted',
      description: 'A new application was submitted to Tech Innovation Challenge',
      user: {
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
      },
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    },
    {
      id: 'act-003',
      type: 'review',
      title: 'Review Completed',
      description: 'Michael Brown completed a review for MediTech Pro',
      user: {
        name: 'Michael Brown',
      },
      timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
    },
    {
      id: 'act-004',
      type: 'call',
      title: 'Call Published',
      description: 'New Healthcare Startups Program call published',
      user: {
        name: 'Admin System',
      },
      timestamp: new Date(Date.now() - 8 * 3600000), // 8 hours ago
    },
    {
      id: 'act-005',
      type: 'application',
      title: 'Application Approved',
      description: 'EcoSolutions application was approved',
      user: {
        name: 'Emma Davis',
        avatar: '/avatars/emma.jpg',
      },
      timestamp: new Date(Date.now() - 1 * 86400000), // 1 day ago
    },
  ];

  // Function to format the timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  // Function to get activity type badge
  const getActivityTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'user':
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>;
      case 'application':
        return <Badge className="bg-green-100 text-green-800">Application</Badge>;
      case 'review':
        return <Badge className="bg-purple-100 text-purple-800">Review</Badge>;
      case 'call':
        return <Badge className="bg-amber-100 text-amber-800">Call</Badge>;
      case 'system':
        return <Badge className="bg-slate-100 text-slate-800">System</Badge>;
      default:
        return <Badge>Activity</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                {activity.user?.avatar ? (
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                ) : null}
                <AvatarFallback>{activity.user?.name.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center pt-1">
                  {getActivityTypeBadge(activity.type)}
                  <span className="ml-2 text-xs text-muted-foreground">{activity.user?.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="ghost" size="sm" className="w-full">
          View all activity
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminRecentActivity; 