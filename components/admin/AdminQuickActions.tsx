import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  FileUp, 
  PlusCircle, 
  Settings, 
  BarChart3, 
  Mail 
} from 'lucide-react';

const AdminQuickActions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <UserPlus className="h-8 w-8 mb-2" />
            <span>Add User</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <PlusCircle className="h-8 w-8 mb-2" />
            <span>New Call</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <FileUp className="h-8 w-8 mb-2" />
            <span>Upload Files</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <BarChart3 className="h-8 w-8 mb-2" />
            <span>Generate Report</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <Mail className="h-8 w-8 mb-2" />
            <span>Send Notification</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
            <Settings className="h-8 w-8 mb-2" />
            <span>System Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions; 