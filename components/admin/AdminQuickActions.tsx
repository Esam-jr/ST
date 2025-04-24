import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  FileUp, 
  Settings, 
  BarChart3, 
  Bell 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminQuickActions: React.FC = () => {
  const router = useRouter();
  
  const navigateToNotifications = () => {
    router.push('/admin?section=notifications');
  };
  
  const showComingSoon = () => {
    toast.success('This feature is coming soon!');
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
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={showComingSoon}>
            <FileUp className="h-8 w-8 mb-2" />
            <span>Upload Files</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={showComingSoon}>
            <BarChart3 className="h-8 w-8 mb-2" />
            <span>Generate Report</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={navigateToNotifications}>
            <Bell className="h-8 w-8 mb-2" />
            <span>Notifications</span>
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