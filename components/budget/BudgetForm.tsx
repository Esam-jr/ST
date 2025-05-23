import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PlusCircle,
  XCircle,
  AlertTriangle,
  Percent,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useBudget } from "@/contexts/BudgetContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

// Define the form schema
const formSchema = z.object({
  totalAmount: z.coerce
    .number()
    .positive("Total amount must be positive")
    .min(1, "Total amount must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  categories: z.array(
    z.object({
      name: z.string().min(1, "Category name is required"),
      description: z.string().nullable(),
      allocatedAmount: z.coerce
        .number()
        .positive("Amount must be positive")
        .min(1, "Amount must be at least 1"),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

// Define the type for budget creation/update
type BudgetInput = {
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  categories: {
    name: string;
    description: string | null;
    allocatedAmount: number;
  }[];
};

interface BudgetFormProps {
  startupCallId: string;
  budget?: any;
  templateData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const BudgetForm = ({
  startupCallId,
  budget,
  templateData,
  onSubmit,
  onCancel,
}: BudgetFormProps) => {
  const { createBudget, updateBudget } = useBudget();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default form values
  const defaultValues: Partial<FormValues> = {
    totalAmount: budget?.totalAmount || 0,
    startDate: budget?.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: budget?.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    categories: budget?.categories?.length
      ? budget.categories.map((cat: any) => ({
          name: cat.name,
          description: cat.description,
          allocatedAmount: cat.allocatedAmount,
        }))
      : [
          {
            name: "General",
            description: null,
            allocatedAmount: 0,
          },
        ],
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Field array for dynamic categories
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  // Apply template data if provided
  useEffect(() => {
    if (templateData && !budget) {
      // Set categories based on template
      if (templateData.categories && templateData.categories.length > 0) {
        const totalAmount = form.getValues().totalAmount || 100000; // Default value if amount is 0
        const newCategories = templateData.categories.map((cat: any) => ({
          name: cat.name,
          description: cat.description || null,
          allocatedAmount: Math.round((cat.percentage / 100) * totalAmount),
        }));
        form.setValue("categories", newCategories);
      }
    }
  }, [templateData, form, budget]);

  // Calculate total allocated amount for categories
  const calculateTotalAllocated = () => {
    const categories = form.watch("categories");
    return categories.reduce(
      (sum, category) => sum + (Number(category.allocatedAmount) || 0),
      0
    );
  };

  const totalAllocated = calculateTotalAllocated();
  const totalAmount = Number(form.watch("totalAmount")) || 0;
  const remainingUnallocated = totalAmount - totalAllocated;

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      let result;
      const budgetData: BudgetInput = {
        totalAmount: data.totalAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        categories: data.categories.map(cat => ({
          name: cat.name,
          description: cat.description || null,
          allocatedAmount: cat.allocatedAmount
        }))
      };

      if (budget) {
        // Update existing budget
        result = await updateBudget(startupCallId, budget.id, budgetData);
      } else {
        // Create new budget
        result = await createBudget(startupCallId, budgetData);
      }

      onSubmit(result);
      toast({
        title: budget ? "Budget Updated" : "Budget Created",
        description: `The budget was successfully ${
          budget ? "updated" : "created"
        }.`,
      });
    } catch (error: any) {
      console.error("Error submitting budget:", error);
      
      // Check for specific error messages
      if (error.response?.data?.error === "No approved application with a startup found for this startup call") {
        toast({
          title: "Cannot Create Budget",
          description: "You need to have an approved application with a startup before creating a budget. Please approve an application first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to save budget. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Distribute remaining amount evenly
  const distributeRemaining = () => {
    if (fields.length === 0 || totalAmount === 0 || remainingUnallocated <= 0)
      return;

    const amountPerCategory =
      Math.round((remainingUnallocated / fields.length) * 100) / 100;
    const newCategories = form.getValues().categories.map((cat) => ({
      ...cat,
      allocatedAmount: Number(cat.allocatedAmount) + amountPerCategory,
    }));

    form.setValue("categories", newCategories);
  };

  // Adjust allocation to not exceed budget
  const adjustToTotal = () => {
    if (fields.length === 0 || totalAmount === 0 || remainingUnallocated >= 0)
      return;

    const factor = totalAmount / totalAllocated;
    const newCategories = form.getValues().categories.map((cat) => ({
      ...cat,
      allocatedAmount:
        Math.round(Number(cat.allocatedAmount) * factor * 100) / 100,
    }));

    form.setValue("categories", newCategories);
  };

  // Validate if total allocated amount doesn't exceed total budget
  const isAllocationValid = totalAllocated <= totalAmount;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Budget Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Enter the total budget amount in USD
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Budget Categories</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  name: "",
                  description: null,
                  allocatedAmount: 0,
                })
              }
            >
              Add Category
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Category {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`categories.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`categories.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`categories.${index}.allocatedAmount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocated Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        {/* Budget Allocation Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Budget:</span>
                <span className="font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                  }).format(totalAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Allocated:</span>
                <span
                  className={
                    !isAllocationValid
                      ? "text-red-500 font-medium"
                      : "font-medium"
                  }
                >
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                  }).format(totalAllocated)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Remaining:</span>
                <span
                  className={
                    remainingUnallocated === 0
                      ? "text-green-600 font-medium"
                      : remainingUnallocated < 0
                      ? "text-red-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                  }).format(Math.abs(remainingUnallocated))}
                  {remainingUnallocated < 0 ? " (over budget)" : ""}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className={`h-full rounded-full ${
                    !isAllocationValid ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      totalAmount > 0
                        ? (totalAllocated / totalAmount) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                ></div>
              </div>

              {remainingUnallocated !== 0 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {remainingUnallocated > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={distributeRemaining}
                    >
                      Distribute Remaining
                    </Button>
                  )}
                  {remainingUnallocated < 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={adjustToTotal}
                    >
                      Adjust to Budget
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {budget ? "Updating..." : "Creating..."}
              </>
            ) : (
              budget ? "Update Budget" : "Create Budget"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
