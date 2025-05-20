import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/contexts/BudgetContext";
import ReceiptUploader from "./ReceiptUploader";

// Define the schema for form validation
const expenseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" }),
  description: z.string().optional(),
  amount: z.coerce
    .number()
    .positive({ message: "Amount must be a positive number" }),
  currency: z.string().default("USD"),
  date: z.date(),
  budgetId: z.string().min(1, { message: "Budget is required" }),
  categoryId: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: {
    id: string;
    title: string;
    description?: string | null;
    amount: number;
    currency: string;
    date: string;
    receipt?: string | null;
    budgetId: string;
    categoryId?: string | null;
  };
  onSubmit: (values: ExpenseFormValues & { receipt?: string | null }) => void;
  onCancel?: () => void;
}

export default function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { toast } = useToast();
  const { budgets, categories, selectedBudgetId } = useBudget();
  const [receiptPath, setReceiptPath] = useState<string | null>(
    expense?.receipt || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or existing expense data
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || "",
      description: expense?.description || "",
      amount: expense?.amount || 0,
      currency: expense?.currency || "USD",
      date: expense?.date ? new Date(expense.date) : new Date(),
      budgetId: expense?.budgetId || selectedBudgetId || "",
      categoryId: expense?.categoryId || "",
    },
  });

  // Reset form when expense prop changes
  useEffect(() => {
    if (expense) {
      form.reset({
        title: expense.title,
        description: expense.description || "",
        amount: expense.amount,
        currency: expense.currency,
        date: new Date(expense.date),
        budgetId: expense.budgetId,
        categoryId: expense.categoryId || "",
      });
      setReceiptPath(expense.receipt || null);
    } else if (selectedBudgetId) {
      form.setValue("budgetId", selectedBudgetId);
    }
  }, [expense, selectedBudgetId, form]);

  // Update category options when budget changes
  const watchedBudgetId = form.watch("budgetId");

  // Get filtered categories based on selected budget
  const filteredCategories = categories.filter(
    (category) => category.budgetId === watchedBudgetId
  );

  // Handle form submission
  const handleSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        receipt: receiptPath,
      });

      if (!expense) {
        // Reset form after successful creation
        form.reset({
          title: "",
          description: "",
          amount: 0,
          currency: "USD",
          date: new Date(),
          budgetId: selectedBudgetId || "",
          categoryId: "",
        });
        setReceiptPath(null);
      }

      toast({
        title: expense ? "Expense updated" : "Expense created",
        description: expense
          ? "Your changes have been saved"
          : "New expense has been added",
      });
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle receipt upload
  const handleFileUploaded = (filePath: string) => {
    setReceiptPath(filePath);
  };

  // Handle removing existing receipt
  const handleRemoveReceipt = () => {
    setReceiptPath(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Expense title" {...field} />
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
                <Textarea
                  placeholder="Optional description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
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
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
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
                        formatDate(field.value)
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budgetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.title}
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
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <ReceiptUploader
          onFileUploaded={handleFileUploaded}
          existingReceipt={receiptPath}
          onRemoveExisting={handleRemoveReceipt}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">
                  {expense ? "Updating..." : "Creating..."}
                </span>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : expense ? (
              "Update Expense"
            ) : (
              "Create Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
