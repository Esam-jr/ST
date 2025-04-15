import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type NotificationTemplate = {
  id: string;
  name: string;
  type: 'email' | 'in-app' | 'sms';
  subject: string;
  body: string;
  status: 'active' | 'inactive' | 'draft';
};

type NotificationChannel = {
  id: string;
  name: string;
  enabled: boolean;
  defaultDelay: number;
};

const AdminNotificationManagement = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      type: 'email',
      subject: 'Welcome to our platform!',
      body: 'Hello {name}, thank you for joining our platform. We are excited to have you onboard!',
      status: 'active',
    },
    {
      id: '2',
      name: 'Password Reset',
      type: 'email',
      subject: 'Password Reset Request',
      body: 'Hello {name}, you requested a password reset. Click {link} to reset your password.',
      status: 'active',
    },
    {
      id: '3',
      name: 'New Review Assignment',
      type: 'in-app',
      subject: 'New Review Assignment',
      body: 'You have been assigned a new startup to review: {startupName}',
      status: 'active',
    },
    {
      id: '4',
      name: 'Application Status Update',
      type: 'sms',
      subject: '',
      body: 'Your application status has been updated to {status}. Log in to check details.',
      status: 'inactive',
    },
  ]);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: '1', name: 'Email', enabled: true, defaultDelay: 0 },
    { id: '2', name: 'In-App', enabled: true, defaultDelay: 0 },
    { id: '3', name: 'SMS', enabled: false, defaultDelay: 0 },
    { id: '4', name: 'Push Notification', enabled: false, defaultDelay: 0 },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleChannelToggle = (id: string, enabled: boolean) => {
    setChannels(channels.map(channel => 
      channel.id === id ? { ...channel, enabled } : channel
    ));
  };

  const handleDelayChange = (id: string, delay: number) => {
    setChannels(channels.map(channel => 
      channel.id === id ? { ...channel, defaultDelay: delay } : channel
    ));
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditMode(false);
  };

  const handleEditTemplate = () => {
    setEditMode(true);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id ? selectedTemplate : t
      ));
      setEditMode(false);
    }
  };

  const handleTemplateChange = (field: keyof NotificationTemplate, value: any) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        [field]: value
      });
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: NotificationTemplate = {
      id: `${templates.length + 1}`,
      name: 'New Template',
      type: 'email',
      subject: '',
      body: '',
      status: 'draft',
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setEditMode(true);
  };

  const handleStatusChange = (status: 'active' | 'inactive' | 'draft') => {
    if (selectedTemplate) {
      handleTemplateChange('status', status);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Management</CardTitle>
        <CardDescription>
          Manage notification settings, channels, and templates for the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="templates">Notification Templates</TabsTrigger>
            <TabsTrigger value="channels">Notification Channels</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Templates</h3>
              <Button onClick={handleCreateTemplate}>Create Template</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 border rounded-md overflow-hidden">
                <div className="p-3 bg-muted font-medium">Template List</div>
                <div className="divide-y">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedTemplate?.id === template.id ? 'bg-muted/50' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.type}</p>
                        </div>
                        <Badge 
                          variant={template.status === 'active' ? 'default' : 
                                 template.status === 'draft' ? 'outline' : 'secondary'}
                        >
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 border rounded-md overflow-hidden">
                <div className="p-3 bg-muted font-medium flex justify-between items-center">
                  <span>Template Details</span>
                  {selectedTemplate && !editMode && (
                    <Button variant="outline" size="sm" onClick={handleEditTemplate}>Edit</Button>
                  )}
                  {selectedTemplate && editMode && (
                    <Button variant="default" size="sm" onClick={handleSaveTemplate}>Save</Button>
                  )}
                </div>
                
                {selectedTemplate ? (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input 
                          id="template-name"
                          value={selectedTemplate.name} 
                          onChange={(e) => handleTemplateChange('name', e.target.value)}
                          disabled={!editMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-type">Type</Label>
                        <Select 
                          disabled={!editMode}
                          value={selectedTemplate.type}
                          onValueChange={(value) => handleTemplateChange('type', value)}
                        >
                          <SelectTrigger id="template-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="in-app">In-App</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {selectedTemplate.type === 'email' && (
                      <div className="space-y-2">
                        <Label htmlFor="template-subject">Subject</Label>
                        <Input 
                          id="template-subject"
                          value={selectedTemplate.subject} 
                          onChange={(e) => handleTemplateChange('subject', e.target.value)}
                          disabled={!editMode}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="template-body">Content</Label>
                      <Textarea 
                        id="template-body"
                        value={selectedTemplate.body} 
                        onChange={(e) => handleTemplateChange('body', e.target.value)}
                        disabled={!editMode}
                        rows={6}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use {'{variable}'} syntax for dynamic content. Available variables: {'{name}'}, {'{link}'}, {'{startupName}'}, {'{status}'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Template Status</Label>
                      <div className="flex space-x-4">
                        <Button 
                          variant={selectedTemplate.status === 'active' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => handleStatusChange('active')}
                          disabled={!editMode}
                        >
                          Active
                        </Button>
                        <Button 
                          variant={selectedTemplate.status === 'inactive' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => handleStatusChange('inactive')}
                          disabled={!editMode}
                        >
                          Inactive
                        </Button>
                        <Button 
                          variant={selectedTemplate.status === 'draft' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => handleStatusChange('draft')}
                          disabled={!editMode}
                        >
                          Draft
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Select a template to view or edit its details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="channels">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default Delay (minutes)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">{channel.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={channel.enabled}
                          onCheckedChange={(checked) => handleChannelToggle(channel.id, checked)}
                        />
                        <span>{channel.enabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={channel.defaultDelay} 
                        onChange={(e) => handleDelayChange(channel.id, parseInt(e.target.value) || 0)}
                        className="w-20" 
                        min={0}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure system-wide email notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">Send a daily summary of all notifications</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Batched Notifications</Label>
                    <p className="text-sm text-muted-foreground">Group multiple notifications into a single email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Email Footer Text</Label>
                  <Textarea placeholder="Enter the text that will appear in the footer of all notification emails" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>Default notification preferences for new users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notification Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>In-App</TableHead>
                      <TableHead>SMS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>System Announcements</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Application Updates</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Review Assignments</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Funding Opportunities</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
};

export default AdminNotificationManagement; 