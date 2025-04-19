import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Initialize forms
  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      company: '',
      bio: ''
    }
  });
  
  const passwordForm = useForm<PasswordFormData>();
  
  // Redirect unauthenticated users
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Loading state
  if (status === 'loading') {
    return (
      <Layout title="Profile Settings">
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  // Handle profile form submission
  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      // In a real app, would call API endpoint to update profile
      console.log('Profile data to update:', data);
      
      // Show success message
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile information. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle password form submission
  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        toast({
          title: 'Error',
          description: 'New passwords do not match.',
          variant: 'destructive',
        });
        return;
      }
      
      // In a real app, would call API endpoint to change password
      console.log('Password data to update:', data);
      
      // Reset form
      passwordForm.reset();
      
      // Show success message
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle profile image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    setUploading(true);
    try {
      // In a real app, would upload the image file to a server
      // For this mock implementation, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Image uploaded',
        description: 'Your profile picture has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Layout title="Profile Settings | My Account">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Personal Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          {/* Personal Info Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile photo</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border mb-4">
                    {profileImage ? (
                      <Image 
                        src={profileImage} 
                        alt="Profile" 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-500">
                          {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mb-4"
                  />
                  
                  <Button 
                    onClick={handleImageUpload} 
                    disabled={!imageFile || uploading}
                    className="w-full"
                  >
                    {uploading ? <LoadingSpinner size="sm" /> : 'Upload Image'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Personal Info Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...profileForm.register('name', { required: true })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register('email', { required: true })}
                          disabled
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...profileForm.register('phone')}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          {...profileForm.register('company')}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...profileForm.register('bio')}
                        placeholder="Tell us a little about yourself..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Save Changes</Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Password Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword', { required: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword', { required: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword', { required: true })}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Update Password</Button>
                  </CardFooter>
                </form>
              </Card>
              
              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">Protect your account with 2FA</p>
                    </div>
                    <Switch id="2fa" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Recovery Codes</h4>
                      <p className="text-sm text-gray-500">Generate backup codes for account recovery</p>
                    </div>
                    <Button variant="outline">Generate Codes</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold mb-3">Email Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="marketing" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="marketing" className="font-medium">Marketing emails</Label>
                      <p className="text-sm text-gray-500">Receive emails about new features, offers and updates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox id="updates" defaultChecked />
                    <div className="grid gap-1.5">
                      <Label htmlFor="updates" className="font-medium">Platform updates</Label>
                      <p className="text-sm text-gray-500">Get notified about system changes and new features</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox id="calls" defaultChecked />
                    <div className="grid gap-1.5">
                      <Label htmlFor="calls" className="font-medium">Startup calls</Label>
                      <p className="text-sm text-gray-500">Get notified about new startup funding opportunities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox id="applications" defaultChecked />
                    <div className="grid gap-1.5">
                      <Label htmlFor="applications" className="font-medium">Application updates</Label>
                      <p className="text-sm text-gray-500">Receive status updates about your funding applications</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h3 className="font-semibold mb-3">In-App Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Application status changes</h4>
                      <p className="text-sm text-gray-500">Get notifications when your application status changes</p>
                    </div>
                    <Switch id="app-status" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New startup calls</h4>
                      <p className="text-sm text-gray-500">Get notified when new funding opportunities are posted</p>
                    </div>
                    <Switch id="app-calls" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Messages</h4>
                      <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                    </div>
                    <Switch id="app-messages" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 