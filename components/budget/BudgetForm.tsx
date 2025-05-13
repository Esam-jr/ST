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
import { PlusCircle, XCircle, AlertTriangle, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface BudgetFormProps {
  startupCallId: string;
  initialData?: {
    budget: any;
    categories: any[];
  };
  templateData?: {
    name: string;
    description: string;
    categories: {
      name: string;
      description: string;
      percentage: number;
    }[];
  } | null;
  onSubmit: (budget: any) => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  startupCallId,
  initialData,
  templateData,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Budget form state
  const [budget, setBudget] = useState({
    title: initialData?.budget?.title || "",
    description: initialData?.budget?.description || "",
    totalAmount: initialData?.budget?.totalAmount || 0,
    currency: initialData?.budget?.currency || "USD",
    fiscalYear:
      initialData?.budget?.fiscalYear || new Date().getFullYear().toString(),
    status: initialData?.budget?.status || "draft",
  });

  // Categories state
  const [categories, setCategories] = useState<
    {
      id?: string;
      name: string;
      description: string;
      allocatedAmount: number;
      allocatedPercentage?: number;
    }[]
  >(
    initialData?.categories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      allocatedAmount: cat.allocatedAmount || 0,
      allocatedPercentage: cat.allocatedAmount
        ? Math.round((cat.allocatedAmount / budget.totalAmount) * 100)
        : 0,
    })) || []
  );

  // Apply template data if provided and no initial data
  useEffect(() => {
    if (templateData && !initialData) {
      // Update title based on template
      setBudget({
        ...budget,
        title: `${templateData.name} Budget`,
        description: templateData.description,
      });

      // Set categories based on template
      if (templateData.categories && templateData.categories.length > 0) {
        const totalAmount = budget.totalAmount || 100000; // Default value if amount is 0
        const newCategories = templateData.categories.map((cat) => {
          const allocatedAmount = (cat.percentage / 100) * totalAmount;
          return {
            name: cat.name,
            description: cat.description,
            allocatedAmount: Math.round(allocatedAmount * 100) / 100, // Round to 2 decimal places
            allocatedPercentage: cat.percentage,
          };
        });
        setCategories(newCategories);
      }
    }
  }, [templateData]);

  // Update category percentages when total amount changes
  useEffect(() => {
    if (budget.totalAmount > 0) {
      setCategories(
        categories.map((cat) => ({
          ...cat,
          allocatedPercentage:
            Math.round((cat.allocatedAmount / budget.totalAmount) * 100) || 0,
        }))
      );
    }
  }, [budget.totalAmount]);

  // Handle input changes for budget fields
  const handleBudgetChange = (field: string, value: any) => {
    setBudget({
      ...budget,
      [field]: value,
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };

  // Add a new category
  const addCategory = () => {
    setCategories([
      ...categories,
      {
        name: "",
        description: "",
        allocatedAmount: 0,
        allocatedPercentage: 0,
      },
    ]);
  };

  // Remove a category
  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  // Handle input changes for category fields
  const handleCategoryChange = (index: number, field: string, value: any) => {
    const newCategories = [...categories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: value,
    };

    // If changing the amount, update the percentage
    if (field === "allocatedAmount" && budget.totalAmount > 0) {
      newCategories[index].allocatedPercentage = Math.round(
        (value / budget.totalAmount) * 100
      );
    }

    // If changing the percentage, update the amount
    if (field === "allocatedPercentage" && budget.totalAmount > 0) {
      newCategories[index].allocatedAmount =
        Math.round((value / 100) * budget.totalAmount * 100) / 100;
    }

    setCategories(newCategories);

    // Clear category errors
    if (errors[`category-${index}-${field}`]) {
      setErrors({
        ...errors,
        [`category-${index}-${field}`]: "",
      });
    }
  };

  // Calculate unallocated amount
  const getTotalAllocated = () => {
    return categories.reduce((sum, cat) => sum + (cat.allocatedAmount || 0), 0);
  };

  const getUnallocatedAmount = () => {
    const totalAllocated = getTotalAllocated();
    return budget.totalAmount - totalAllocated;
  };

  const getAllocatedPercentage = () => {
    if (budget.totalAmount === 0) return 0;
    return Math.round((getTotalAllocated() / budget.totalAmount) * 100);
  };

  // Distribute remaining amount evenly
  const distributeRemaining = () => {
    if (categories.length === 0 || budget.totalAmount === 0) return;

    const unallocatedAmount = getUnallocatedAmount();
    if (unallocatedAmount <= 0) return;

    const amountPerCategory =
      Math.round((unallocatedAmount / categories.length) * 100) / 100;

    setCategories(
      categories.map((cat) => ({
        ...cat,
        allocatedAmount: cat.allocatedAmount + amountPerCategory,
        allocatedPercentage: Math.round(
          ((cat.allocatedAmount + amountPerCategory) / budget.totalAmount) * 100
        ),
      }))
    );
  };

  // Auto-adjust allocation to reach 100%
  const adjustToTotal = () => {
    if (categories.length === 0 || budget.totalAmount === 0) return;

    const totalAllocated = getTotalAllocated();
    const factor = budget.totalAmount / totalAllocated;

    setCategories(
      categories.map((cat) => {
        const newAmount = Math.round(cat.allocatedAmount * factor * 100) / 100;
        return {
          ...cat,
          allocatedAmount: newAmount,
          allocatedPercentage: Math.round(
            (newAmount / budget.totalAmount) * 100
          ),
        };
      })
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!budget.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (budget.totalAmount <= 0) {
      newErrors.totalAmount = "Total amount must be greater than zero";
    }

    if (!budget.fiscalYear.trim()) {
      newErrors.fiscalYear = "Fiscal year is required";
    }

    // Validate categories
    categories.forEach((category, index) => {
      if (!category.name.trim()) {
        newErrors[`category-${index}-name`] = "Category name is required";
      }

      if (category.allocatedAmount < 0) {
        newErrors[`category-${index}-allocatedAmount`] =
          "Amount cannot be negative";
      }
    });

    // Check if total allocation exceeds budget
    const totalAllocated = getTotalAllocated();
    if (totalAllocated > budget.totalAmount) {
      newErrors.totalAllocation = "Total allocation exceeds budget amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const categoriesData = categories.map((category) => ({
        id: category.id, // Include id for existing categories
        name: category.name,
        description: category.description,
        allocatedAmount: category.allocatedAmount,
      }));

      const budgetData = {
        ...budget,
        categories: categoriesData,
      };

      let response;
      if (initialData?.budget?.id) {
        // Edit existing budget
        response = await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${initialData.budget.id}`,
          budgetData
        );
      } else {
        // Create new budget
        response = await axios.post(
          `/api/startup-calls/${startupCallId}/budgets`,
          budgetData
        );
      }

      onSubmit(response.data);
    } catch (error: any) {
      console.error("Error saving budget:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to save budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: budget.currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Budget Title</Label>
            <Input
              id="title"
              value={budget.title}
              onChange={(e) => handleBudgetChange("title", e.target.value)}
              placeholder="Enter a title for this budget"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={budget.description}
              onChange={(e) =>
                handleBudgetChange("description", e.target.value)
              }
              placeholder="Brief description of this budget"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <div className="relative">
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget.totalAmount || ""}
                  onChange={(e) =>
                    handleBudgetChange(
                      "totalAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="pl-7"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <span className="text-sm text-muted-foreground">$</span>
                </div>
              </div>
              {errors.totalAmount && (
                <p className="text-sm text-red-500">{errors.totalAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={budget.currency}
                onValueChange={(value) => handleBudgetChange("currency", value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Input
                id="fiscalYear"
                value={budget.fiscalYear}
                onChange={(e) =>
                  handleBudgetChange("fiscalYear", e.target.value)
                }
                placeholder="YYYY"
              />
              {errors.fiscalYear && (
                <p className="text-sm text-red-500">{errors.fiscalYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={budget.status}
                onValueChange={(value) => handleBudgetChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Budget Allocation Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Summary of your budget allocation</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Budget:</span>
                <span className="font-bold">
                  {formatCurrency(budget.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Allocated:</span>
                <span
                  className={
                    getAllocatedPercentage() === 100
                      ? "text-green-600 font-medium"
                      : "font-medium"
                  }
                >
                  {formatCurrency(getTotalAllocated())} (
                  {getAllocatedPercentage()}%)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unallocated:</span>
                <span
                  className={
                    getUnallocatedAmount() === 0
                      ? "text-green-600 font-medium"
                      : getUnallocatedAmount() < 0
                      ? "text-red-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {formatCurrency(getUnallocatedAmount())} (
                  {100 - getAllocatedPercentage()}%)
                </span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    getAllocatedPercentage() === 100
                      ? "bg-green-500"
                      : getAllocatedPercentage() > 100
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(getAllocatedPercentage(), 100)}%`,
                  }}
                ></div>
              </div>

              {getUnallocatedAmount() !== 0 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {getUnallocatedAmount() > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={distributeRemaining}
                    >
                      Distribute Remaining
                    </Button>
                  )}
                  {getAllocatedPercentage() !== 100 && (
                    <Button variant="outline" size="sm" onClick={adjustToTotal}>
                      Adjust to 100%
                    </Button>
                  )}
                </div>
              )}

              {errors.totalAllocation && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.totalAllocation}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-medium">Budget Categories</Label>
          <Button variant="outline" size="sm" onClick={addCategory}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
            <h3 className="text-lg font-medium text-muted-foreground">
              No Categories Added
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add categories to allocate your budget
            </p>
            <Button onClick={addCategory}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Category
            </Button>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Category Name</TableHead>
                  <TableHead className="w-[30%]">Description</TableHead>
                  <TableHead className="w-[15%]">Amount</TableHead>
                  <TableHead className="w-[15%]">Percentage</TableHead>
                  <TableHead className="w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryChange(index, "name", e.target.value)
                        }
                        placeholder="Category name"
                        className={
                          errors[`category-${index}-name`]
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors[`category-${index}-name`] && (
                        <p className="text-xs text-red-500">
                          {errors[`category-${index}-name`]}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={category.description}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Brief description"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={category.allocatedAmount || ""}
                          onChange={(e) =>
                            handleCategoryChange(
                              index,
                              "allocatedAmount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`pl-6 ${
                            errors[`category-${index}-allocatedAmount`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                          <span className="text-xs text-muted-foreground">
                            $
                          </span>
                        </div>
                        {errors[`category-${index}-allocatedAmount`] && (
                          <p className="text-xs text-red-500">
                            {errors[`category-${index}-allocatedAmount`]}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={category.allocatedPercentage || ""}
                          onChange={(e) =>
                            handleCategoryChange(
                              index,
                              "allocatedPercentage",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="pr-8"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCategory(index)}
                      >
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <LoadingSpinner />
          ) : initialData?.budget?.id ? (
            "Update Budget"
          ) : (
            "Create Budget"
          )}
        </Button>
      </div>
    </div>
  );
};
