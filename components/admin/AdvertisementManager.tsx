import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  Share2,
  ImageIcon,
  SendIcon,
  CheckCircle,
  X,
  ExternalLink,
} from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: string;
  platforms: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS = ["Twitter", "LinkedIn", "Facebook", "Instagram", "Email"];
const STATUSES = ["draft", "scheduled", "published", "cancelled"];

export default function AdvertisementManager() {
  const { data: session } = useSession();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    scheduledDate: "",
    platforms: [] as string[],
    status: "draft",
  });

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishingAd, setPublishingAd] = useState<Advertisement | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishResults, setPublishResults] = useState<any[] | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/advertisements");
      if (!response.ok) throw new Error("Failed to fetch advertisements");
      const data = await response.json();
      setAdvertisements(data);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast({
        title: "Error",
        description: "Failed to load advertisements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      imageUrl: "",
      scheduledDate: "",
      platforms: [],
      status: "draft",
    });
    setEditingId(null);
  };

  const handleFormOpen = (ad?: Advertisement) => {
    if (ad) {
      // Format the date for datetime-local input
      const date = new Date(ad.scheduledDate);
      const formattedDate = date.toISOString().slice(0, 16);

      setFormData({
        title: ad.title,
        content: ad.content,
        imageUrl: ad.imageUrl || "",
        scheduledDate: formattedDate,
        platforms: ad.platforms,
        status: ad.status,
      });
      setEditingId(ad.id);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || session.user.role !== "ADMIN") {
      toast({
        title: "Unauthorized",
        description: "You do not have permission to perform this action",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingId
        ? `/api/advertisements/${editingId}`
        : "/api/advertisements";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok)
        throw new Error(
          `Failed to ${editingId ? "update" : "create"} advertisement`
        );

      const updatedAd = await response.json();

      if (editingId) {
        setAdvertisements((ads) =>
          ads.map((ad) => (ad.id === editingId ? updatedAd : ad))
        );
        toast({
          title: "Success",
          description: "Advertisement updated successfully",
        });
      } else {
        setAdvertisements((ads) => [updatedAd, ...ads]);
        toast({
          title: "Success",
          description: "Advertisement created successfully",
        });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(
        `Error ${editingId ? "updating" : "creating"} advertisement:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          editingId ? "update" : "create"
        } advertisement`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;

    try {
      const response = await fetch(`/api/advertisements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete advertisement");

      setAdvertisements((ads) => ads.filter((ad) => ad.id !== id));
      toast({
        title: "Success",
        description: "Advertisement deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/advertisements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok)
        throw new Error("Failed to update advertisement status");

      setAdvertisements((ads) =>
        ads.map((ad) => (ad.id === id ? { ...ad, status: newStatus } : ad))
      );

      toast({
        title: "Success",
        description: `Advertisement ${
          newStatus === "published" ? "published" : "status updated"
        }`,
      });
    } catch (error) {
      console.error("Error updating advertisement status:", error);
      toast({
        title: "Error",
        description: "Failed to update advertisement status",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleStatusSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  // Filter advertisements based on tab and search
  const filteredAds = advertisements
    .filter((ad) => {
      if (activeTab === "all") return true;
      return ad.status === activeTab;
    })
    .filter(
      (ad) =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Group statistics
  const stats = {
    draft: advertisements.filter((ad) => ad.status === "draft").length,
    scheduled: advertisements.filter((ad) => ad.status === "scheduled").length,
    published: advertisements.filter((ad) => ad.status === "published").length,
    cancelled: advertisements.filter((ad) => ad.status === "cancelled").length,
    total: advertisements.length,
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            Draft
          </span>
        );
      case "scheduled":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Scheduled
          </span>
        );
      case "published":
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Published
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const handlePublishToSocialMedia = async () => {
    if (!publishingAd || selectedPlatforms.length === 0) return;

    setPublishLoading(true);
    setPublishResults(null);

    try {
      const response = await fetch("/api/advertisements/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adId: publishingAd.id,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish advertisement");
      }

      // Update the advertisement in the local state with new platforms
      setAdvertisements((ads) =>
        ads.map((ad) =>
          ad.id === publishingAd.id
            ? {
                ...ad,
                platforms: data.advertisement.platforms,
              }
            : ad
        )
      );

      setPublishResults(data.results);
      toast({
        title: "Success",
        description: data.message || "Advertisement published to social media",
      });
    } catch (error) {
      console.error("Error publishing to social media:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to publish advertisement",
        variant: "destructive",
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const openPublishDialog = (ad: Advertisement) => {
    setPublishingAd(ad);
    setSelectedPlatforms([]);
    setPublishResults(null);
    setPublishDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advertisement Management</h1>
          <p className="text-gray-500">
            Create and manage advertisements across different platforms
          </p>
        </div>

        <Button onClick={() => handleFormOpen()} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Advertisement
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Ads</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <p className="text-3xl font-bold">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-3xl font-bold">{stats.scheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-3xl font-bold">{stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-3xl font-bold">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full sm:w-auto sm:min-w-[300px]">
          <Input
            placeholder="Search advertisements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Advertisements list */}
      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No advertisements found</p>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search criteria
              </p>
            )}
            {!searchTerm && activeTab !== "all" && (
              <p className="text-gray-400 text-sm mt-1">
                No advertisements with {activeTab} status
              </p>
            )}
          </div>
        ) : (
          filteredAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{ad.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Scheduled for{" "}
                      {new Date(ad.scheduledDate).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div>{renderStatusBadge(ad.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3">
                    <p className="text-gray-700 whitespace-pre-line">
                      {ad.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ad.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  {ad.imageUrl && (
                    <div className="md:col-span-2">
                      <div className="relative h-32 rounded-md overflow-hidden">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div className="text-xs text-gray-500">
                  Created {new Date(ad.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {ad.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(ad.id, "scheduled")}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  )}

                  {(ad.status === "draft" || ad.status === "scheduled") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(ad.id, "published")}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <SendIcon className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}

                  {ad.status === "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPublishDialog(ad)}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFormOpen(ad)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(ad.id)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Advertisement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Advertisement" : "Create New Advertisement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the details below to modify this advertisement."
                : "Fill in the details below to create a new advertisement."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                {formData.imageUrl && (
                  <div className="h-10 w-10 rounded overflow-hidden border">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://via.placeholder.com/40?text=Error";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={formData.platforms.includes(platform)}
                      onCheckedChange={() => handlePlatformChange(platform)}
                    />
                    <Label
                      htmlFor={`platform-${platform}`}
                      className="font-normal"
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update Advertisement" : "Create Advertisement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add this Social Media Publishing Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Social Media</DialogTitle>
            <DialogDescription>
              Publish this advertisement to social media platforms.
            </DialogDescription>
          </DialogHeader>

          {publishingAd && (
            <div className="py-4">
              <h3 className="font-medium mb-2">{publishingAd.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {publishingAd.content}
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Select Platforms</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((platform) => (
                      <div
                        key={platform}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`platform-${platform}`}
                          checked={selectedPlatforms.includes(platform)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlatforms((prev) => [
                                ...prev,
                                platform,
                              ]);
                            } else {
                              setSelectedPlatforms((prev) =>
                                prev.filter((p) => p !== platform)
                              );
                            }
                          }}
                          disabled={publishingAd.platforms.includes(platform)}
                        />
                        <Label
                          htmlFor={`platform-${platform}`}
                          className={`font-normal ${
                            publishingAd.platforms.includes(platform)
                              ? "text-gray-400"
                              : ""
                          }`}
                        >
                          {platform}
                          {publishingAd.platforms.includes(platform) &&
                            " (Already shared)"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {publishResults && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Publishing Results
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {publishResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm ${
                            result.success
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <div className="flex items-center">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            <span className="font-medium">
                              {result.platform}:
                            </span>
                          </div>
                          <p className="ml-6">{result.message}</p>
                          {result.success && result.postUrl && (
                            <p className="ml-6 mt-1">
                              <a
                                href={result.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Post
                              </a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPublishDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handlePublishToSocialMedia}
              disabled={selectedPlatforms.length === 0 || publishLoading}
            >
              {publishLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Publishing...
                </>
              ) : (
                "Publish Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
