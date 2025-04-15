import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, 
  Bell,
  UserCog,
  Settings,
  Layers,
  Globe,
  FileText,
  Calendar,
  Mail,
  ShieldCheck,
  Save,
  Undo2
} from 'lucide-react';

export default function AdminSettings() {
  // General Settings
  const [platformName, setPlatformName] = useState('Startup Management System');
  const [platformDescription, setPlatformDescription] = useState('Platform for connecting startups with resources, funding, and mentorship');
  const [logoUrl, setLogoUrl] = useState('/images/logo.svg');
  const [primaryColor, setPrimaryColor] = useState('#0070f3');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  
  // Email Settings
  const [emailFromName, setEmailFromName] = useState('Startup Management');
  const [emailFromAddress, setEmailFromAddress] = useState('noreply@startupmanagement.com');
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('smtpuser');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••');
  
  // Notification Settings
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(true);
  const [notifyNewStartups, setNotifyNewStartups] = useState(true);
  const [notifyNewReviews, setNotifyNewReviews] = useState(true);
  const [notifyNewSponsorships, setNotifyNewSponsorships] = useState(true);
  const [notifySystemUpdates, setNotifySystemUpdates] = useState(false);
  
  // Security Settings
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [passwordMinLength, setPasswordMinLength] = useState('8');
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  
  // API Settings
  const [enablePublicApi, setEnablePublicApi] = useState(false);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState('60');
  const [apiKey, setApiKey] = useState('sk_live_1a2b3c4d5e6f7g8h9i0j');
  
  const handleSaveSettings = (tab: string) => {
    // In real application, we would save these settings to the backend
    alert(`Settings saved for ${tab} tab`);
  };
  
  const handleResetSettings = (tab: string) => {
    // In real application, we would reset these settings to their default values
    alert(`Settings reset for ${tab} tab`);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure the platform settings, notifications, and security options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>API</span>
              </TabsTrigger>
            </TabsList>
            
            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input 
                      id="platform-name" 
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="platform-description">Platform Description</Label>
                    <Textarea 
                      id="platform-description" 
                      rows={3}
                      value={platformDescription}
                      onChange={(e) => setPlatformDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input 
                      id="logo-url" 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="primary-color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResetSettings('general')}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSaveSettings('general')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* Email Settings Tab */}
            <TabsContent value="email" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-from-name">From Name</Label>
                    <Input 
                      id="email-from-name" 
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-from-address">From Email Address</Label>
                    <Input 
                      id="email-from-address" 
                      type="email"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input 
                      id="smtp-host" 
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input 
                      id="smtp-port" 
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">SMTP Username</Label>
                    <Input 
                      id="smtp-username" 
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input 
                      id="smtp-password" 
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  We recommend using a dedicated transactional email service for better deliverability.
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResetSettings('email')}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSaveSettings('email')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* Notification Settings Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications for various system events
                    </p>
                  </div>
                  <Switch
                    checked={enableEmailNotifications}
                    onCheckedChange={setEnableEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable in-browser notifications for real-time updates
                    </p>
                  </div>
                  <Switch
                    checked={enableBrowserNotifications}
                    onCheckedChange={setEnableBrowserNotifications}
                  />
                </div>
                
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Notification Events</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="notify-new-startups" className="cursor-pointer">
                        New Startup Registrations
                      </Label>
                    </div>
                    <Switch
                      id="notify-new-startups"
                      checked={notifyNewStartups}
                      onCheckedChange={setNotifyNewStartups}
                      disabled={!enableEmailNotifications && !enableBrowserNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="notify-new-reviews" className="cursor-pointer">
                        New Review Submissions
                      </Label>
                    </div>
                    <Switch
                      id="notify-new-reviews"
                      checked={notifyNewReviews}
                      onCheckedChange={setNotifyNewReviews}
                      disabled={!enableEmailNotifications && !enableBrowserNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="notify-new-sponsorships" className="cursor-pointer">
                        New Sponsorship Activities
                      </Label>
                    </div>
                    <Switch
                      id="notify-new-sponsorships"
                      checked={notifyNewSponsorships}
                      onCheckedChange={setNotifyNewSponsorships}
                      disabled={!enableEmailNotifications && !enableBrowserNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="notify-system-updates" className="cursor-pointer">
                        System Updates and Maintenance
                      </Label>
                    </div>
                    <Switch
                      id="notify-system-updates"
                      checked={notifySystemUpdates}
                      onCheckedChange={setNotifySystemUpdates}
                      disabled={!enableEmailNotifications && !enableBrowserNotifications}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResetSettings('notifications')}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSaveSettings('notifications')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* Security Settings Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for all admin users
                    </p>
                  </div>
                  <Switch
                    checked={requireTwoFactor}
                    onCheckedChange={setRequireTwoFactor}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="session-timeout" 
                      type="number"
                      min="5"
                      max="1440"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time after which inactive users will be logged out
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-min-length">Password Minimum Length</Label>
                    <Input 
                      id="password-min-length" 
                      type="number"
                      min="6"
                      max="32"
                      value={passwordMinLength}
                      onChange={(e) => setPasswordMinLength(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
                      Require at least one special character in passwords
                    </p>
                  </div>
                  <Switch
                    checked={passwordRequireSpecial}
                    onCheckedChange={setPasswordRequireSpecial}
                  />
                </div>
                
                <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Regular security audits are recommended to ensure your system remains secure.
                    The last security audit was performed on May 15, 2023.
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResetSettings('security')}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSaveSettings('security')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* API Settings Tab */}
            <TabsContent value="api" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Public API</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow external applications to access data via the API
                    </p>
                  </div>
                  <Switch
                    checked={enablePublicApi}
                    onCheckedChange={setEnablePublicApi}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
                  <Input 
                    id="rate-limit" 
                    type="number"
                    min="10"
                    max="1000"
                    value={rateLimitPerMinute}
                    onChange={(e) => setRateLimitPerMinute(e.target.value)}
                    disabled={!enablePublicApi}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of API requests allowed per minute per API key
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="api-key" 
                      value={apiKey}
                      readOnly
                      disabled={!enablePublicApi}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => alert('API key regenerated')}
                      disabled={!enablePublicApi}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this key secret. If compromised, regenerate immediately.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md bg-red-50 dark:bg-red-950/30 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <strong>Warning:</strong> Enabling the public API allows external access to your system data.
                    Ensure you have proper authentication and rate limiting configured.
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResetSettings('api')}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button onClick={() => handleSaveSettings('api')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 