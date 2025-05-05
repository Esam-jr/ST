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
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { Loader2, Plus } from 'lucide-react';

interface ApplySponsorshipFormProps {
  opportunityId: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  onSuccess?: () => void;
}

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

  // Define the form schema with new fields
  const formSchema = z.object({
    amount: z.number()
      .min(1, 'Amount must be greater than 0')
      .refine((val) => val >= minAmount, {
        message: `Amount must be at least ${currency} ${minAmount}`,
      })
      .refine((val) => val <= maxAmount, {
        message: `Amount cannot exceed ${currency} ${maxAmount}`,
      }),
    message: z.string().optional(),
    // New sponsor information fields
    sponsorName: z.string().min(2, 'Sponsor name is required'),
    contactPerson: z.string().min(2, 'Contact person name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    // New sponsorship type fields
    sponsorshipType: z.enum(['FINANCIAL', 'IN_KIND', 'OTHER']),
    otherType: z.string().optional(),
  }).refine(
    (data) => {
      if (data.sponsorshipType === 'OTHER') {
        return !!data.otherType && data.otherType.length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the sponsorship type',
      path: ['otherType'],
    }
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: minAmount,
      message: '',
      sponsorName: '',
      contactPerson: '',
      email: session?.user?.email || '',
      phone: '',
      website: '',
      sponsorshipType: 'FINANCIAL',
      otherType: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
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
        ...values,
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
      
      // Extract error message from the response if available
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to submit application. Please try again.';
      
      // Check for specific error types
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sponsor Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sponsor Information</h3>
              
              <FormField
                control={form.control}
                name="sponsorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name of the individual or organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of the primary contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="For correspondence" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="For direct communication" {...field} />
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
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="To learn more about the sponsor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sponsorship Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sponsorship Details</h3>

              <FormField
                control={form.control}
                name="sponsorshipType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Sponsorship Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="FINANCIAL" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Financial Contribution
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="IN_KIND" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            In-Kind Support
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

              {form.watch('sponsorshipType') === 'OTHER' && (
                <FormField
                  control={form.control}
                  name="otherType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please Specify</FormLabel>
                      <FormControl>
                        <Input placeholder="Specify the sponsorship type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={minAmount}
                        max={maxAmount}
                        step="0.01"
                        placeholder={`Enter amount in ${currency}`}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount must be between {currency} {minAmount} and {currency} {maxAmount}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional information or questions"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 