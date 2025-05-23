import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the form validation schema
const formSchema = z.object({
  reviewerId: z.string({
    required_error: "Reviewer is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }).min(new Date(), {
    message: "Due date must be in the future",
  }),
});

// Define the prop types
interface ReviewerAssignmentProps {
  applicationId: string;
  applicationName: string;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

// Define a reviewer type
interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ReviewerAssignment: React.FC<ReviewerAssignmentProps> = ({
  applicationId,
  applicationName,
  open,
  onClose,
  onAssigned,
}) => {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reviewerId: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
    },
  });

  // Fetch reviewers when the dialog opens
  useEffect(() => {
    if (open) {
      fetchReviewers();
    }
  }, [open]);

  // Fetch available reviewers
  const fetchReviewers = async () => {
    try {
      setLoading(true);
      // We need to create this API endpoint
      const { data } = await axios.get('/api/users?role=REVIEWER');
      setReviewers(data);
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviewers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/applications/${applicationId}/assign-reviewer`, {
        reviewerId: values.reviewerId,
        dueDate: values.dueDate.toISOString(),
      });
      
      toast({
        title: 'Reviewer Assigned',
        description: 'The reviewer has been successfully assigned to this application.',
      });
      
      onAssigned();
      onClose();
    } catch (error: any) {
      console.error('Error assigning reviewer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign reviewer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Reviewer</DialogTitle>
          <DialogDescription>
            Assign a reviewer to evaluate "{applicationName}"
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="reviewerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviewer</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reviewer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading reviewers...
                          </div>
                        ) : reviewers.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No reviewers available
                          </div>
                        ) : (
                          reviewers.map((reviewer) => (
                            <SelectItem key={reviewer.id} value={reviewer.id}>
                              {reviewer.name} ({reviewer.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a reviewer to evaluate this application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select when the review should be completed by
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Reviewer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewerAssignment; 