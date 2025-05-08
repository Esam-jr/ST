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

  return (
    <>
      <Head>
        <title>Edit Sponsorship Opportunity</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl bg-white shadow-sm rounded-lg my-6 p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/sponsorship-opportunities")}
              className="mb-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Opportunities
            </Button>
            <h1 className="text-2xl font-bold">Edit Sponsorship Opportunity</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Opportunity Details</CardTitle>
                    <CardDescription>
                      Edit the details of this sponsorship opportunity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter opportunity title"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A clear, concise title for the sponsorship
                            opportunity.
                          </FormDescription>
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
                            <Textarea
                              placeholder="Describe the sponsorship opportunity..."
                              className="h-32 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide details about what this sponsorship is for
                            and why sponsors should be interested.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits</FormLabel>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {field.value.map((benefit, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                              >
                                {benefit}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBenefit(index)}
                                  className="ml-1 rounded-full hover:bg-gray-200 p-1"
                                >
                                  <Trash className="h-3 w-3" />
                                  <span className="sr-only">Remove</span>
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a new benefit"
                              value={newBenefit}
                              onChange={(e) => setNewBenefit(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddBenefit}
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              Add
                            </Button>
                          </div>
                          <FormDescription>
                            List the benefits that sponsors will receive.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="minAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>Maximum Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10000"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">
                                  USD - US Dollar
                                </SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">
                                  GBP - British Pound
                                </SelectItem>
                                <SelectItem value="CAD">
                                  CAD - Canadian Dollar
                                </SelectItem>
                                <SelectItem value="AUD">
                                  AUD - Australian Dollar
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
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
                          <FormItem className="flex flex-col">
                            <FormLabel>Application Deadline</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>No deadline</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When applications for this opportunity will close.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="startupCallId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Associated Startup Call (Optional)
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a startup call" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {startupCalls.map((call) => (
                                <SelectItem key={call.id} value={call.id}>
                                  {call.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Link this opportunity to a specific startup call.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push("/admin/sponsorship-opportunities")
                      }
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          )}
        </div>
      </div>
    </>
  );
}
