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
} from "@/components/ui/form";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  totalAmount: z.coerce
    .number()
    .positive("Total amount must be positive")
    .min(1, "Total amount must be at least 1"),
  currency: z.string().min(1, "Currency is required"),
  fiscalYear: z.string().min(1, "Fiscal year is required"),
  status: z.string().min(1, "Status is required"),
  categories: z.array(
    z.object({
      name: z.string().min(1, "Category name is required"),
      description: z.string().optional(),
      allocatedAmount: z.coerce
        .number()
        .positive("Amount must be positive")
        .min(1, "Amount must be at least 1"),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

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

  // Calculate current year for default fiscal year
  const currentYear = new Date().getFullYear().toString();

  // Set default form values
  const defaultValues: Partial<FormValues> = {
    title: budget?.title || "",
    description: budget?.description || "",
    totalAmount: budget?.totalAmount || 0,
    currency: budget?.currency || "INR",
    fiscalYear: budget?.fiscalYear || currentYear,
    status: budget?.status || "active",
    categories: budget?.categories?.length
      ? budget.categories.map((cat: any) => ({
          name: cat.name,
          description: cat.description || "",
          allocatedAmount: cat.allocatedAmount,
        }))
      : [{ name: "", description: "", allocatedAmount: 0 }],
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
      // Update title based on template
      form.setValue("title", `${templateData.name} Budget`);
      form.setValue("description", templateData.description || "");

      // Set categories based on template
      if (templateData.categories && templateData.categories.length > 0) {
        const totalAmount = form.getValues().totalAmount || 100000; // Default value if amount is 0
        const newCategories = templateData.categories.map((cat: any) => ({
          name: cat.name,
          description: cat.description || "",
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

      if (budget) {
        // Update existing budget
        result = await updateBudget(startupCallId, budget.id, data);
      } else {
        // Create new budget
        result = await createBudget(startupCallId, data);
      }

      onSubmit(result);
      toast({
        title: budget ? "Budget Updated" : "Budget Created",
        description: `The budget was successfully ${
          budget ? "updated" : "created"
        }.`,
      });
    } catch (error) {
      console.error("Error submitting budget:", error);
      toast({
        title: "Error",
        description: "Failed to save budget. Please try again.",
        variant: "destructive",
      });
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
        {/* Basic Budget Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter budget title" {...field} />
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
                    placeholder="Describe the purpose of this budget"
                    className="min-h-[100px]"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-sm text-gray-500">
                          {form.watch("currency") === "INR" ? "₹" : "$"}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("totalAmount");
                        }}
                      />
                    </div>
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
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fiscalYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Year</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiscal year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        Number(currentYear) - 1,
                        Number(currentYear),
                        Number(currentYear) + 1,
                        Number(currentYear) + 2,
                      ].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                    currency: form.watch("currency"),
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
                    currency: form.watch("currency"),
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
                    currency: form.watch("currency"),
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

        {/* Budget Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Budget Categories</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ name: "", description: "", allocatedAmount: 0 })
              }
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Category {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name={`categories.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Category name" {...field} />
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
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-sm text-gray-500">
                                {form.watch("currency") === "INR" ? "₹" : "$"}
                              </span>
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                form.trigger(
                                  `categories.${index}.allocatedAmount`
                                );
                              }}
                            />
                          </div>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional description"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}

            {fields.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">
                  No Categories
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add categories to allocate your budget
                </p>
                <Button
                  type="button"
                  onClick={() =>
                    append({ name: "", description: "", allocatedAmount: 0 })
                  }
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Category
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (totalAmount > 0 && !isAllocationValid)}
          >
            {isSubmitting
              ? "Saving..."
              : budget
              ? "Update Budget"
              : "Create Budget"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
