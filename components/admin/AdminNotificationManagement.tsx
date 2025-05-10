import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bell, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  userId: string;
};

type NotificationTemplate = {
  id: string;
  name: string;
  type: "email" | "in-app" | "sms";
  subject: string;
  body: string;
  status: "active" | "inactive" | "draft";
};

type NotificationChannel = {
  id: string;
  name: string;
  enabled: boolean;
  defaultDelay: number;
};

const AdminNotificationManagement = () => {
  // Add toast hook
  const { toast } = useToast();

  // State for existing notification templates & channels
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to our platform!",
      body: "Hello {name}, thank you for joining our platform. We are excited to have you onboard!",
      status: "active",
    },
    {
      id: "2",
      name: "Password Reset",
      type: "email",
      subject: "Password Reset Request",
      body: "Hello {name}, you requested a password reset. Click {link} to reset your password.",
      status: "active",
    },
    {
      id: "3",
      name: "New Review Assignment",
      type: "in-app",
      subject: "New Review Assignment",
      body: "You have been assigned a new startup to review: {startupName}",
      status: "active",
    },
    {
      id: "4",
      name: "Application Status Update",
      type: "in-app",
      subject: "Application Status Update",
      body: "Your application status has been updated to {status}. Log in to check details.",
      status: "active",
    },
    {
      id: "5",
      name: "Startup Selected as Winner",
      type: "in-app",
      subject: "Congratulations! Your Startup Has Been Selected",
      body: 'Congratulations! Your startup "{startupName}" has been selected as a winner for the "{callTitle}" call. You now have access to the project management dashboard to track your budget and milestones.',
      status: "active",
    },
  ]);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: "1", name: "Email", enabled: true, defaultDelay: 0 },
    { id: "2", name: "In-App", enabled: true, defaultDelay: 0 },
    { id: "3", name: "SMS", enabled: false, defaultDelay: 0 },
    { id: "4", name: "Push Notification", enabled: false, defaultDelay: 0 },
  ]);

  // State for the real notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  // Fetch notifications when the component mounts or when active tab changes to notifications
  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotifications(0, true);
    }
  }, [activeTab]);

  const fetchNotifications = async (
    pageNumber: number,
    reset: boolean = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch all notifications in the system
      // For now, we're using the same API but will display them as if they're all notifications
      const response = await axios.get(
        `/api/user/notifications?offset=${
          pageNumber * ITEMS_PER_PAGE
        }&limit=${ITEMS_PER_PAGE}`
      );

      const newNotifications = response.data.notifications;
      setNotifications((prev) =>
        reset ? newNotifications : [...prev, ...newNotifications]
      );
      setHasMore(newNotifications.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleChannelToggle = (id: string, enabled: boolean) => {
    setChannels(
      channels.map((channel) =>
        channel.id === id ? { ...channel, enabled } : channel
      )
    );
  };

  const handleDelayChange = (id: string, delay: number) => {
    setChannels(
      channels.map((channel) =>
        channel.id === id ? { ...channel, defaultDelay: delay } : channel
      )
    );
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
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id ? selectedTemplate : t
        )
      );
      setEditMode(false);
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
    }
  };

  const handleTemplateChange = (
    field: keyof NotificationTemplate,
    value: any
  ) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        [field]: value,
      });
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: NotificationTemplate = {
      id: `${templates.length + 1}`,
      name: "New Template",
      type: "email",
      subject: "",
      body: "",
      status: "draft",
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setEditMode(true);
  };

  const handleStatusChange = (status: "active" | "inactive" | "draft") => {
    if (selectedTemplate) {
      handleTemplateChange("status", status);
    }
  };

  // Format notification time as a relative time (e.g., "2 hours ago")
  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "Unknown time";
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REVIEW_ASSIGNMENT":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "REVIEW_SUBMISSION":
        return <Check className="h-5 w-5 text-green-500" />;
      case "APPLICATION_STATUS":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "ALL_REVIEWS_COMPLETED":
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Send a test notification function (fake implementation)
  const sendTestNotification = () => {
    if (!selectedTemplate) return;

    toast({
      title: "Test Sent",
      description: `Test notification sent using template: ${selectedTemplate.name}`,
    });
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
        <Tabs
          defaultValue="templates"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="templates">Notification Templates</TabsTrigger>
            <TabsTrigger value="channels">Notification Channels</TabsTrigger>
            <TabsTrigger value="notifications">All Notifications</TabsTrigger>
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
                      className={`p-3 cursor-pointer hover:bg-muted/50 ${
                        selectedTemplate?.id === template.id
                          ? "bg-muted/50"
                          : ""
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.type}
                          </p>
                        </div>
                        <Badge
                          variant={
                            template.status === "active"
                              ? "default"
                              : template.status === "draft"
                              ? "outline"
                              : "secondary"
                          }
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
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditTemplate}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={sendTestNotification}
                      >
                        Send Test
                      </Button>
                    </div>
                  )}
                  {selectedTemplate && editMode && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveTemplate}
                    >
                      Save
                    </Button>
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
                          onChange={(e) =>
                            handleTemplateChange("name", e.target.value)
                          }
                          disabled={!editMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-type">Type</Label>
                        <Select
                          disabled={!editMode}
                          value={selectedTemplate.type}
                          onValueChange={(value: any) =>
                            handleTemplateChange("type", value)
                          }
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

                    {selectedTemplate.type === "email" && (
                      <div className="space-y-2">
                        <Label htmlFor="template-subject">Subject</Label>
                        <Input
                          id="template-subject"
                          value={selectedTemplate.subject}
                          onChange={(e) =>
                            handleTemplateChange("subject", e.target.value)
                          }
                          disabled={!editMode}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="template-body">Message Body</Label>
                      <Textarea
                        id="template-body"
                        value={selectedTemplate.body}
                        onChange={(e) =>
                          handleTemplateChange("body", e.target.value)
                        }
                        disabled={!editMode}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{variable}"} syntax to include dynamic content.
                        Available variables depend on notification type.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex space-x-3">
                        <Button
                          variant={
                            selectedTemplate.status === "draft"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          disabled={!editMode}
                          onClick={() => handleStatusChange("draft")}
                        >
                          Draft
                        </Button>
                        <Button
                          variant={
                            selectedTemplate.status === "inactive"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          disabled={!editMode}
                          onClick={() => handleStatusChange("inactive")}
                        >
                          Inactive
                        </Button>
                        <Button
                          variant={
                            selectedTemplate.status === "active"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          disabled={!editMode}
                          onClick={() => handleStatusChange("active")}
                        >
                          Active
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Select a template to view or edit its details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-medium">Notification Channels</h3>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default Delay (minutes)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">
                        {channel.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(checked) =>
                              handleChannelToggle(channel.id, checked)
                            }
                          />
                          <span>
                            {channel.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="w-24"
                          value={channel.defaultDelay}
                          onChange={(e) =>
                            handleDelayChange(
                              channel.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-medium">All System Notifications</h3>
            </div>

            {loading && page === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="py-10 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(0, true)}
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border rounded-md">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No notifications found in the system
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              {notification.type}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {notification.title}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {notification.message}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                notification.read ? "outline" : "default"
                              }
                            >
                              {notification.read ? "Read" : "Unread"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatNotificationTime(notification.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-medium">
                Global Notification Settings
              </h3>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">
                        Enable System Notifications
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Master toggle to enable or disable all notification
                        features
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Real-time Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable WebSocket-based real-time notifications
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Notification Digest</h4>
                      <p className="text-sm text-muted-foreground">
                        Send a summary of unread notifications to users
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="digest-frequency">Digest Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger id="digest-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">
                        Auto-delete Read Notifications
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically delete read notifications after the
                        specified period
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retention-period">Retention Period</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="retention-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminNotificationManagement;
