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
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  benefits: z.array(z.string()).min(1, "At least one benefit is required"),
  minAmount: z.number().min(0, "Minimum amount must be positive"),
  maxAmount: z.number().min(0, "Maximum amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  status: z.string(),
  deadline: z.date().nullable(),
  startupCallId: z.string().min(1, "Startup call is required"),
  industryFocus: z.string().optional(),
  tags: z.array(z.string()).optional(),
  eligibility: z.string().optional(),
  coverImage: z.string().optional(),
  visibility: z.string().optional(),
  tiers: z.any().optional(),
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
  visibility?: string;
  tiers?: any;
}

interface StartupCall {
  id: string;
  title: string;
}

export default function EditSponsorshipOpportunityPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(null);
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Initialize the form with proper defaultValues
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      benefits: [],
      minAmount: 0,
      maxAmount: 0,
      currency: "USD",
      status: "DRAFT",
      deadline: null,
      startupCallId: "",
      industryFocus: "",
      tags: [],
      eligibility: "",
      coverImage: "",
      visibility: "PUBLIC",
      tiers: null,
    },
  });

  // Update form values when opportunity data is fetched
  useEffect(() => {
    if (opportunity) {
      form.reset({
        title: opportunity.title,
        description: opportunity.description,
        benefits: opportunity.benefits || [],
        minAmount: opportunity.minAmount,
        maxAmount: opportunity.maxAmount,
        currency: opportunity.currency,
        status: opportunity.status,
        deadline: opportunity.deadline ? new Date(opportunity.deadline) : null,
        startupCallId: opportunity.startupCallId,
        industryFocus: opportunity.industryFocus || "",
        tags: opportunity.tags || [],
        eligibility: opportunity.eligibility || "",
        coverImage: opportunity.coverImage || "",
        visibility: opportunity.visibility || "PUBLIC",
        tiers: opportunity.tiers || null,
      });
      setTags(opportunity.tags || []);
    }
  }, [opportunity]);

  // Check authentication and fetch data
  useEffect(() => {
    const init = async () => {
      if (sessionStatus === "authenticated") {
        if (session?.user?.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }

        if (id && typeof id === 'string') {
          try {
            setLoading(true);
            await Promise.all([
              fetchOpportunityData(id),
              fetchStartupCalls()
            ]);
          } catch (error) {
            console.error("Error during initialization:", error);
            
            // Implement retry logic
            if (retryCount < MAX_RETRIES) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => init(), 1000 * (retryCount + 1)); // Exponential backoff
            } else {
              toast({
                title: "Error",
                description: "Failed to load the opportunity. Please try again.",
                variant: "destructive",
              });
              router.push("/admin/sponsorship-opportunities");
            }
          } finally {
            setLoading(false);
          }
        }
      } else if (sessionStatus === "unauthenticated") {
        router.push("/auth/signin?callbackUrl=/admin/sponsorship-opportunities");
      }
    };

    init();
  }, [sessionStatus, session, id]);

  // Fetch the opportunity
  const fetchOpportunityData = async (opportunityId: string) => {
    try {
      const response = await axios.get(`/api/admin/sponsorship-opportunities/${opportunityId}`);
      const opportunity = response.data;
      setOpportunity(opportunity);
    } catch (error) {
      console.error("Error fetching opportunity data:", error);
      throw error;
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

      await axios.patch(
        `/api/admin/sponsorship-opportunities/${id}`,
        values
      );

      toast({
        title: "Success",
        description: "The sponsorship opportunity has been updated successfully",
      });

      // Redirect back to the opportunities list
      await router.push("/admin/sponsorship-opportunities");
    } catch (error) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to update the sponsorship opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industryFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Focus</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eligibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eligibility</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          value={field.value ? field.value.toISOString().slice(0, 16) : ''} 
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Add a benefit"
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          if (newBenefit.trim()) {
                            field.onChange([...field.value, newBenefit.trim()]);
                            setNewBenefit("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.value.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={benefit} readOnly />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newBenefits = [...field.value];
                              newBenefits.splice(index, 1);
                              field.onChange(newBenefits);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Section */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          if (newTag.trim()) {
                            field.onChange([...field.value, newTag.trim()]);
                            setNewTag("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...field.value];
                              newTags.splice(index, 1);
                              field.onChange(newTags);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </div>
    </Layout>
  );
}
