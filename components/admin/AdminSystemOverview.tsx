import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Users, Briefcase, Award, ClipboardList } from 'lucide-react';

const AdminSystemOverview = () => {
  // Mock data that would come from an API in a real app
  const stats = [
    {
      id: 1,
      title: 'Total Users',
      value: 1243,
      change: 12.5,
      positive: true,
      icon: Users,
    },
    {
      id: 2,
      title: 'Active Startup Calls',
      value: 24,
      change: 4.2,
      positive: true,
      icon: Briefcase,
    },
    {
      id: 3,
      title: 'Sponsor Calls',
      value: 8,
      change: -2.1,
      positive: false,
      icon: Award,
    },
    {
      id: 4,
      title: 'Pending Reviews',
      value: 57,
      change: 18.3,
      positive: false,
      icon: ClipboardList,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">System Overview</h2>
        <Badge variant="outline" className="text-xs">Last updated: Today, 14:30</Badge>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <div className="flex items-center text-xs">
                {stat.positive ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={stat.positive ? "text-green-500" : "text-red-500"}>
                  {Math.abs(stat.change)}%
                </span>
                <span className="ml-1 text-muted-foreground">from last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminSystemOverview; 