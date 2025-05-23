import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  ChevronLeft,
  Loader2,
  Tag,
  CalendarIcon,
  Trash,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Layout from '@/components/layout/Layout';

// Define the form schema
const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  benefits: z.array(z.string()),
  minAmount: z.number().min(1, "Minimum amount must be at least 1"),
  maxAmount: z.number().min(1, "Maximum amount must be at least 1"),
  currency: z.string().min(1, "Currency is required"),
  status: z.string().min(1, "Status is required"),
  deadline: z.date().nullable().optional(),
  startupCallId: z.string().optional(),
  industryFocus: z.string().optional(),
  eligibility: z.string().optional(),
  coverImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define the opportunity type
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: string | null;
  startupCallId: string;
  createdAt: string;
  updatedAt: string;
  industryFocus?: string;
  tags: string[];
  eligibility?: string;
  coverImage?: string;
}

interface StartupCall {
  id: string;
  title: string;
}

export default function EditSponsorshipOpportunityPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(
    null
  );
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      benefits: [],
      minAmount: 100,
      maxAmount: 1000,
      currency: "USD",
      status: "DRAFT",
      deadline: null,
      startupCallId: "",
      industryFocus: "",
      eligibility: "",
      coverImage: "",
    },
  });

  // Check authentication and fetch data
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      if (id) {
        fetchOpportunity();
        fetchStartupCalls();
      }
    } else if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/admin/sponsorship-opportunities");
    }
  }, [sessionStatus, session, id]);

  // Fetch the opportunity
  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/sponsorship-opportunities/${id}`
      );
      const data = response.data;

      setOpportunity(data);
      setTags(data.tags || []);

      // Set form values from fetched data
      form.reset({
        title: data.title,
        description: data.description,
        benefits: data.benefits || [],
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        currency: data.currency,
        status: data.status,
        deadline: data.deadline ? new Date(data.deadline) : null,
        startupCallId: data.startupCallId || "none",
        industryFocus: data.industryFocus,
        eligibility: data.eligibility,
        coverImage: data.coverImage,
      });
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch startup calls for dropdown
  const fetchStartupCalls = async () => {
    try {
      const response = await axios.get("/api/startup-calls");
      setStartupCalls(response.data);
    } catch (error) {
      console.error("Error fetching startup calls:", error);
    }
  };

  // Submit the form
  const onSubmit = async (values: FormValues) => {
    if (!id) return;

    try {
      setIsSubmitting(true);

      // Convert "none" to empty string for startupCallId
      const submissionValues = {
        ...values,
        startupCallId:
          values.startupCallId === "none" ? "" : values.startupCallId,
        tags,
      };

      await axios.patch(
        `/api/admin/sponsorship-opportunities/${id}`,
        submissionValues
      );

      toast({
        title: "Opportunity Updated",
        description:
          "The sponsorship opportunity has been updated successfully",
      });

      // Redirect back to the opportunities list
      router.push("/admin/sponsorship-opportunities");
    } catch (error) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to update the sponsorship opportunity",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding a new benefit
  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      const currentBenefits = form.getValues("benefits") || [];
      form.setValue("benefits", [...currentBenefits, newBenefit]);
      setNewBenefit("");
    }
  };

  // Handle removing a benefit
  const handleRemoveBenefit = (index: number) => {
    const currentBenefits = form.getValues("benefits") || [];
    form.setValue(
      "benefits",
      currentBenefits.filter((_, i) => i !== index)
    );
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <Layout title="Edit Sponsorship Opportunity">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!opportunity) {
    return (
      <Layout title="Opportunity Not Found">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/admin/sponsorship-opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Opportunity Not Found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Sponsorship Opportunity">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link href="/admin/sponsorship-opportunities" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Sponsorship Opportunity</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={opportunity.title}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={opportunity.description}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, description: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Industry Focus</label>
                <Input
                  value={opportunity.industryFocus || ''}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, industryFocus: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Eligibility</label>
                <Textarea
                  value={opportunity.eligibility || ''}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, eligibility: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Amount</label>
                  <Input
                    type="number"
                    value={opportunity.minAmount}
                    onChange={(e) =>
                      setOpportunity({
                        ...opportunity,
                        minAmount: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Amount</label>
                  <Input
                    type="number"
                    value={opportunity.maxAmount}
                    onChange={(e) =>
                      setOpportunity({
                        ...opportunity,
                        maxAmount: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={opportunity.status}
                  onValueChange={(value) =>
                    setOpportunity({ ...opportunity, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <Input
                  type="datetime-local"
                  value={opportunity.deadline ? opportunity.deadline.slice(0, 16) : ''}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, deadline: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                <Input
                  value={opportunity.coverImage || ''}
                  onChange={(e) =>
                    setOpportunity({ ...opportunity, coverImage: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Benefits</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit"
                />
                <Button type="button" onClick={handleAddBenefit}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {opportunity.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={benefit} readOnly />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/admin/sponsorship-opportunities">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
