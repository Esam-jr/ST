import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { Loader2, Plus, Building2, DollarSign, Users, Mail, Phone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Add type for the form
type SponsorType = "COMPANY" | "INDIVIDUAL" | "NGO" | "FOUNDATION" | "OTHER";

const SPONSOR_TYPES = [
  { value: "COMPANY" as const, label: "Company" },
  { value: "INDIVIDUAL" as const, label: "Individual" },
  { value: "NGO" as const, label: "Non-Governmental Organization" },
  { value: "FOUNDATION" as const, label: "Foundation" },
  { value: "OTHER" as const, label: "Other" }
] as const;

const ORGANIZATION_SIZES = [
  "SOLO",
  "SMALL_TEAM",
  "MEDIUM",
  "LARGE",
  "ENTERPRISE"
] as const;

const TAX_STATUS_OPTIONS = [
  "FOR_PROFIT",
  "NONPROFIT",
  "PUBLIC_CHARITY",
  "PRIVATE_FOUNDATION",
  "OTHER"
] as const;

const PAYMENT_SCHEDULES = [
  { value: "ONE_TIME", label: "One-time Payment" },
  { value: "MONTHLY", label: "Monthly Installments" },
  { value: "QUARTERLY", label: "Quarterly Installments" },
] as const;

// Form validation schema
const applicationSchema = z.object({
  // Sponsor Information
  sponsorType: z.enum(["COMPANY", "INDIVIDUAL", "NGO", "FOUNDATION", "OTHER"]),
  organizationName: z.string().optional(),
  legalName: z.string().min(2, "Legal name is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  description: z.string().min(50, "Please provide a detailed description"),
  annualBudget: z.string().optional(),
  size: z.string().optional(),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  taxStatus: z.string().optional(),

  // Contact Information
  primaryContact: z.object({
    name: z.string().min(2, "Contact name is required"),
    title: z.string().min(2, "Job title is required"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Please enter a valid phone number"),
  }),
  alternateContact: z
    .object({
      name: z.string(),
      title: z.string(),
      email: z.string().email("Please enter a valid email"),
      phone: z.string(),
    })
    .optional(),

  // Sponsorship Details
  proposedAmount: z.number().min(1, "Amount must be greater than 0"),
  sponsorshipGoals: z.string().min(10, "Please describe your sponsorship goals"),
  hasPreviousSponsorships: z.boolean().default(false),
  previousSponsorshipsDetails: z.string().optional(),
  preferredPaymentSchedule: z.string().optional(),
  additionalRequests: z.string().optional(),
  proposedStartDate: z.string().optional(),
  proposedEndDate: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplySponsorshipFormProps {
  opportunityId: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  onSuccess?: () => void;
}

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
];

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Media",
  "Energy",
  "Other",
];

const SPONSORSHIP_GOALS = [
  "Brand Awareness",
  "Lead Generation",
  "Community Engagement",
  "Product Showcase",
  "Talent Acquisition",
  "Market Research",
  "Social Impact",
  "Innovation Access",
];

export default function ApplySponsorshipForm({
  opportunityId,
  minAmount,
  maxAmount,
  currency,
  onSuccess,
}: ApplySponsorshipFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onBlur',
    defaultValues: {
      sponsorType: "COMPANY",
      hasPreviousSponsorships: false,
      proposedAmount: minAmount,
      primaryContact: {
        name: "",
        title: "",
        email: "",
        phone: "",
      },
      proposedStartDate: "",
      proposedEndDate: "",
    },
  });

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    if (!session?.user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit your application.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/sponsorship-opportunities/${opportunityId}/apply`, {
        ...data,
        sponsorId: session.user.id,
      });

      toast({
        title: 'Application Submitted',
        description: 'Your sponsorship application has been submitted successfully.',
      });

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to submit application. Please try again.';
      
      if (error.response?.status === 503) {
        toast({
          title: 'Database Connection Error',
          description: 'Unable to connect to the database. Please try again later.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('Network Error') || !navigator.onLine) {
        toast({
          title: 'Network Error',
          description: 'Check your internet connection and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-w-[120px] flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Sponsorship</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit your sponsorship application.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Sponsor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Sponsor Information
                </CardTitle>
                <CardDescription>
                  Tell us about your organization or yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                    name="sponsorType"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Sponsor Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="COMPANY" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Company
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="INDIVIDUAL" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Individual
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="NGO" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                NGO
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="FOUNDATION" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Foundation
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                                <RadioGroupItem value="OTHER" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Other
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                    name="legalName"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Legal Name</FormLabel>
                    <FormControl>
                          <Input placeholder="Enter legal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                    name="organizationName"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Organization Name (if applicable)</FormLabel>
                    <FormControl>
                          <Input placeholder="Enter organization name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                    name="website"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Website</FormLabel>
                    <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ORGANIZATION_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxStatus"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Tax Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                    <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax status" />
                            </SelectTrigger>
                    </FormControl>
                          <SelectContent>
                            {TAX_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your organization or yourself..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Who should we contact regarding this sponsorship?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="space-y-4">
                  <h4 className="text-sm font-medium">Primary Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                      name="primaryContact.name"
                render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryContact.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter job title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryContact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryContact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sponsorship Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Sponsorship Details
                </CardTitle>
                <CardDescription>
                  Tell us about your sponsorship interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proposedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Amount ({currency})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={minAmount}
                            max={maxAmount}
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Min: {minAmount} {currency}, Max: {maxAmount} {currency}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredPaymentSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Schedule</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_SCHEDULES.map((schedule) => (
                              <SelectItem key={schedule.value} value={schedule.value}>
                                {schedule.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sponsorshipGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsorship Goals</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your goals and objectives for this sponsorship..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                  name="hasPreviousSponsorships"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Have you sponsored similar initiatives before?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasPreviousSponsorships") && (
                  <FormField
                    control={form.control}
                    name="previousSponsorshipsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Sponsorship Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your previous sponsorship experiences..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proposedStartDate"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Proposed Start Date</FormLabel>
                    <FormControl>
                      <Input
                            type="date" 
                        {...field}
                            value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                    name="proposedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalRequests"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Additional Requests or Comments</FormLabel>
                    <FormControl>
                      <Textarea
                          placeholder="Any additional information you'd like to share..."
                          className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 