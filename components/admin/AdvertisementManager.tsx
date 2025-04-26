import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, Pencil, Trash2, Image, ExternalLink } from 'lucide-react';

// Advertisement type definition matching the schema
type Advertisement = {
  id: string;
  title: string;
  description: string;
  content: string;
  mediaUrl?: string;
  platforms: string[];
  startupCallId: string;
  status: string;
  publishedDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
};

interface AdvertisementManagerProps {
  startupCallId?: string;
  sponsorCallId?: string;
  type?: 'startup' | 'sponsor';
}

export default function AdvertisementManager({ startupCallId, sponsorCallId, type = 'startup' }: AdvertisementManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [startupCalls, setStartupCalls] = useState<{id: string, title: string}[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    mediaUrl: '',
    platforms: ['website'],
    status: 'DRAFT',
    publishedDate: '',
    expiryDate: '',
    startupCallId: startupCallId || '',
    sponsorCallId: sponsorCallId || '',
    type: type
  });
  
  // Fetch advertisements
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (type === 'startup' && startupCallId) {
          params.append('startupCallId', startupCallId);
        } else if (type === 'sponsor' && sponsorCallId) {
          params.append('sponsorCallId', sponsorCallId);
        }
        
        const response = await axios.get(`/api/advertisements?${params.toString()}`);
        setAdvertisements(response.data);
        
        // Also fetch startup calls for dropdown if needed
        if (session?.user?.role === 'ADMIN' && !startupCallId && !sponsorCallId) {
          const callsResponse = await axios.get('/api/startup-calls?status=PUBLISHED');
          setStartupCalls(callsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching advertisements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load advertisements',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvertisements();
  }, [toast, startupCallId, sponsorCallId, type, session]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };
  
  // Handle platforms changes
  const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      if (checked) {
        return { ...prev, platforms: [...prev.platforms, value] };
      } else {
        return { ...prev, platforms: prev.platforms.filter(p => p !== value) };
      }
    });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      mediaUrl: '',
      platforms: ['website'],
      status: 'DRAFT',
      publishedDate: '',
      expiryDate: '',
      startupCallId: startupCallId || '',
      sponsorCallId: sponsorCallId || '',
      type: type
    });
    setCurrentAd(null);
  };
  
  // Open edit dialog with advertisement data
  const handleEdit = (ad: Advertisement) => {
    setFormData({
      title: ad.title,
      description: ad.description,
      content: ad.content,
      mediaUrl: ad.mediaUrl || '',
      platforms: ad.platforms,
      status: ad.status,
      publishedDate: ad.publishedDate ? new Date(ad.publishedDate).toISOString().split('T')[0] : '',
      expiryDate: ad.expiryDate ? new Date(ad.expiryDate).toISOString().split('T')[0] : '',
      startupCallId: ad.startupCallId || '',
      sponsorCallId: ad.sponsorCallId || '',
      type: type
    });
    
    setCurrentAd(ad);
    setIsDialogOpen(true);
  };
  
  // Delete advertisement
  const handleDelete = async () => {
    if (!currentAd) return;
    
    try {
      await axios.delete(`/api/advertisements/${currentAd.id}`);
      
      // Remove from state
      setAdvertisements(prev => prev.filter(ad => ad.id !== currentAd.id));
      
      toast({
        title: 'Success',
        description: 'Advertisement deleted successfully',
      });
      
      setIsDeleteDialogOpen(false);
      setCurrentAd(null);
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete advertisement',
        variant: 'destructive',
      });
    }
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse dates and prepare data
      const adData = {
        ...formData,
        publishedDate: formData.publishedDate ? new Date(formData.publishedDate).toISOString() : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
      };
      
      // Remove empty fields
      if (!adData.startupCallId) delete adData.startupCallId;
      if (!adData.sponsorCallId) delete adData.sponsorCallId;
      
      let response;
      if (currentAd) {
        // Update
        response = await axios.put(`/api/advertisements/${currentAd.id}`, adData);
        
        // Update in state
        setAdvertisements(prev => prev.map(ad => 
          ad.id === currentAd.id ? response.data : ad
        ));
        
        toast({
          title: 'Success',
          description: 'Advertisement updated successfully',
        });
      } else {
        // Create
        response = await axios.post('/api/advertisements', adData);
        
        // Add to state
        setAdvertisements(prev => [...prev, response.data]);
        
        toast({
          title: 'Success',
          description: 'Advertisement created successfully',
        });
      }
      
      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save advertisement',
        variant: 'destructive',
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advertisement Management</h2>
          <p className="text-muted-foreground">
            {type === 'startup' 
              ? 'Create and manage advertising materials for startup calls' 
              : 'Create and manage advertising materials for sponsor opportunities'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Advertisement
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Advertisements</CardTitle>
          <CardDescription>
            Manage promotional content for your startup calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {advertisements.length === 0 ? (
            <div className="text-center py-8">
              <Image className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No advertisements yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first advertisement to promote your startup call.
              </p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Advertisement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="font-medium">{ad.title}</div>
                      <div className="text-sm text-muted-foreground">{ad.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.status === 'PUBLISHED' ? 'default' : ad.status === 'ARCHIVED' ? 'secondary' : 'outline'}>
                        {ad.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ad.platforms.map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ad.publishedDate)}</TableCell>
                    <TableCell>{formatDate(ad.expiryDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ad)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentAd(ad);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentAd ? 'Edit Advertisement' : 'Create Advertisement'}</DialogTitle>
            <DialogDescription>
              {currentAd ? 'Update advertisement details' : 'Fill in the details to create a new advertisement'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="min-h-[150px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="mediaUrl">Media URL (Optional)</Label>
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleInputChange}
                  placeholder="https://"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id="platform-website"
                      value="website"
                      className="h-4 w-4"
                      checked={formData.platforms.includes('website')}
                      onChange={handlePlatformChange}
                    />
                    <Label htmlFor="platform-website">Website</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id="platform-email"
                      value="email"
                      className="h-4 w-4"
                      checked={formData.platforms.includes('email')}
                      onChange={handlePlatformChange}
                    />
                    <Label htmlFor="platform-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id="platform-social"
                      value="social"
                      className="h-4 w-4"
                      checked={formData.platforms.includes('social')}
                      onChange={handlePlatformChange}
                    />
                    <Label htmlFor="platform-social">Social Media</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      id="platform-print"
                      value="print"
                      className="h-4 w-4"
                      checked={formData.platforms.includes('print')}
                      onChange={handlePlatformChange}
                    />
                    <Label htmlFor="platform-print">Print</Label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.status === 'PUBLISHED' && (
                  <div className="grid gap-2">
                    <Label htmlFor="publishedDate">Publish Date</Label>
                    <Input
                      id="publishedDate"
                      name="publishedDate"
                      type="date"
                      value={formData.publishedDate}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                />
              </div>
              
              {!startupCallId && !sponsorCallId && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="callType">Advertisement Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'startup' | 'sponsor' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup Call</SelectItem>
                      <SelectItem value="sponsor">Sponsor Opportunity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formData.type === 'startup' && !startupCallId && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="startupCallId">Startup Call</Label>
                  {startupCalls.length > 0 ? (
                    <Select
                      value={formData.startupCallId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, startupCallId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select startup call" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {startupCalls.map(call => (
                          <SelectItem key={call.id} value={call.id}>
                            {call.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="startupCallId"
                      name="startupCallId"
                      value={formData.startupCallId}
                      onChange={handleInputChange}
                      placeholder="Enter startup call ID"
                    />
                  )}
                </div>
              )}
              
              {formData.type === 'sponsor' && !sponsorCallId && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="sponsorCallId">Sponsor Opportunity ID</Label>
                  <Input
                    id="sponsorCallId"
                    name="sponsorCallId"
                    value={formData.sponsorCallId}
                    onChange={handleInputChange}
                    placeholder="Enter sponsor opportunity ID"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentAd ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 