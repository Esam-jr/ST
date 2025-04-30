import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  FileUp, 
  Settings, 
  BarChart3, 
  Bell,
  Calendar,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminQuickActions: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const navigateToNotifications = () => {
    router.push('/admin?section=notifications');
  };
  
  const navigateToAdvertisements = () => {
    router.push('/admin?section=advertisements');
  };
  
  const navigateToEvents = () => {
    router.push('/admin/events');
  };
  
  const showComingSoon = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is coming soon!"
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={showComingSoon}>
            <UserPlus className="h-8 w-8 mb-2" />
            <span>Add User</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={navigateToAdvertisements}>
            <FileText className="h-8 w-8 mb-2" />
            <span>Advertisements</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={navigateToEvents}>
            <Calendar className="h-8 w-8 mb-2" />
            <span>Event Calendar</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={navigateToNotifications}>
            <Bell className="h-8 w-8 mb-2" />
            <span>Notifications</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={showComingSoon}>
            <BarChart3 className="h-8 w-8 mb-2" />
            <span>Generate Report</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={showComingSoon}>
            <Settings className="h-8 w-8 mb-2" />
            <span>System Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions; 