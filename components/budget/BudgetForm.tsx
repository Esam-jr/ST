import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  Trash,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Save,
} from "lucide-react";
import { useBudget, Budget, BudgetCategory } from "@/contexts/BudgetContext";

interface BudgetFormProps {
  startupCallId: string;
  initialData?: {
    budget?: Partial<Budget>;
    categories?: Partial<BudgetCategory>[];
  };
  onSubmit?: (budget: Budget) => void;
  onCancel?: () => void;
}

// Budget form with validation
export const BudgetForm: React.FC<BudgetFormProps> = ({
  startupCallId,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { createBudget, updateBudget, createCategory, isLoading } = useBudget();

  // Form state
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState({
    title: initialData?.budget?.title || "",
    description: initialData?.budget?.description || "",
    totalAmount: initialData?.budget?.totalAmount || 0,
    currency: initialData?.budget?.currency || "USD",
    fiscalYear:
      initialData?.budget?.fiscalYear || new Date().getFullYear().toString(),
    status: initialData?.budget?.status || "draft",
  });

  // Categories state
  const [categories, setCategories] = useState<Partial<BudgetCategory>[]>(
    initialData?.categories || [
      { name: "", description: "", allocatedAmount: 0 },
    ]
  );

  // Total allocated amount (for validation)
  const [totalAllocated, setTotalAllocated] = useState(0);

  // Calculate total allocation when categories change
  useEffect(() => {
    const sum = categories.reduce(
      (acc, cat) => acc + (cat.allocatedAmount || 0),
      0
    );
    setTotalAllocated(sum);
  }, [categories]);

  // Handle budget form changes
  const handleChange = (field: string, value: any) => {
    setFormValues({
      ...formValues,
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

  // Handle category changes
  const handleCategoryChange = (index: number, field: string, value: any) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value,
    };
    setCategories(updatedCategories);

    // Clear category errors
    if (errors[`category_${index}_${field}`]) {
      setErrors({
        ...errors,
        [`category_${index}_${field}`]: "",
      });
    }
  };

  // Add a new category
  const addCategory = () => {
    setCategories([
      ...categories,
      { name: "", description: "", allocatedAmount: 0 },
    ]);
  };

  // Remove a category
  const removeCategory = (index: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
  };

  // Validate step 1 (Budget details)
  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};

    if (!formValues.title.trim()) {
      stepErrors.title = "Title is required";
    }

    if (formValues.totalAmount <= 0) {
      stepErrors.totalAmount = "Total amount must be greater than zero";
    }

    if (!formValues.fiscalYear.trim()) {
      stepErrors.fiscalYear = "Fiscal year is required";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Validate step 2 (Categories)
  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {};

    // Check if at least one category exists
    if (categories.length === 0) {
      stepErrors.categories = "At least one category is required";
      setErrors(stepErrors);
      return false;
    }

    // Validate each category
    let isValid = true;

    categories.forEach((category, index) => {
      if (!category.name?.trim()) {
        stepErrors[`category_${index}_name`] = "Category name is required";
        isValid = false;
      }

      if (!category.allocatedAmount || category.allocatedAmount <= 0) {
        stepErrors[`category_${index}_allocatedAmount`] =
          "Amount must be greater than zero";
        isValid = false;
      }
    });

    // Check if total allocation exceeds total budget
    if (totalAllocated > formValues.totalAmount) {
      stepErrors.allocation = `Total allocation (${totalAllocated}) exceeds budget amount (${formValues.totalAmount})`;
      isValid = false;
    }

    setErrors(stepErrors);
    return isValid;
  };

  // Move to next step
  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  // Move to previous step
  const prevStep = () => {
    setStep(1);
  };

  // Submit the form
  const submitForm = async () => {
    if (!validateStep2()) return;

    try {
      // Create or update the budget
      const isEditing = !!initialData?.budget?.id;

      const budgetData = {
        title: formValues.title,
        description: formValues.description,
        totalAmount: parseFloat(formValues.totalAmount.toString()),
        currency: formValues.currency,
        fiscalYear: formValues.fiscalYear,
        status: formValues.status,
      };

      let budget;

      if (isEditing && initialData?.budget?.id) {
        budget = await updateBudget(
          startupCallId,
          initialData.budget.id,
          budgetData
        );
      } else {
        budget = await createBudget(startupCallId, budgetData);
      }

      // Create or update categories
      const budgetId = budget.id;

      // Process categories
      for (const category of categories) {
        await createCategory(startupCallId, budgetId, {
          name: category.name || "",
          description: category.description || "",
          allocatedAmount: parseFloat(
            category.allocatedAmount?.toString() || "0"
          ),
        });
      }

      if (onSubmit) {
        onSubmit(budget);
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      setErrors({
        submit: "An error occurred while saving the budget. Please try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData?.budget?.id ? "Edit Budget" : "Create New Budget"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? "Enter the basic details for this budget"
            : "Define budget categories and allocations"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant={step === 1 ? "default" : "outline"}
              size="sm"
              className="rounded-full w-8 h-8 p-0"
              disabled={step === 1}
              onClick={prevStep}
            >
              1
            </Button>
            <div className="h-0.5 flex-1 bg-muted mx-2"></div>
            <Button
              variant={step === 2 ? "default" : "outline"}
              size="sm"
              className="rounded-full w-8 h-8 p-0"
              disabled={step === 2}
              onClick={validateStep1 ? nextStep : undefined}
            >
              2
            </Button>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Budget Details</span>
            <span>Categories</span>
          </div>
        </div>

        {/* Global errors */}
        {errors.submit && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Budget Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Budget Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formValues.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Q1 2024 Marketing Budget"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalYear">
                  Fiscal Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fiscalYear"
                  value={formValues.fiscalYear}
                  onChange={(e) => handleChange("fiscalYear", e.target.value)}
                  placeholder="2024"
                />
                {errors.fiscalYear && (
                  <p className="text-sm text-destructive">
                    {errors.fiscalYear}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formValues.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Provide a brief description of this budget"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">
                  Total Budget Amount{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formValues.totalAmount}
                  onChange={(e) =>
                    handleChange("totalAmount", parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                />
                {errors.totalAmount && (
                  <p className="text-sm text-destructive">
                    {errors.totalAmount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formValues.currency}
                  onValueChange={(value) => handleChange("currency", value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formValues.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Budget Categories */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium">Budget Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Define how the budget will be allocated across different
                  categories
                </p>
              </div>
              <Button onClick={addCategory} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Category
              </Button>
            </div>

            {/* Allocation warning */}
            {totalAllocated !== formValues.totalAmount && (
              <Alert
                variant={
                  totalAllocated > formValues.totalAmount
                    ? "destructive"
                    : "warning"
                }
                className="mt-2"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {totalAllocated > formValues.totalAmount
                    ? "Over-allocation"
                    : "Incomplete allocation"}
                </AlertTitle>
                <AlertDescription>
                  {totalAllocated > formValues.totalAmount
                    ? `You've allocated $${totalAllocated} which exceeds the total budget of $${formValues.totalAmount}.`
                    : `You've allocated $${totalAllocated} out of $${
                        formValues.totalAmount
                      }. $${
                        formValues.totalAmount - totalAllocated
                      } remains unallocated.`}
                </AlertDescription>
              </Alert>
            )}

            {errors.categories && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.categories}</AlertDescription>
              </Alert>
            )}

            {errors.allocation && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Allocation Error</AlertTitle>
                <AlertDescription>{errors.allocation}</AlertDescription>
              </Alert>
            )}

            {/* Categories */}
            <div className="space-y-4">
              {categories.map((category, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        Category {index + 1}
                      </CardTitle>
                      {categories.length > 1 && (
                        <Button
                          onClick={() => removeCategory(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Category Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={category.name || ""}
                          onChange={(e) =>
                            handleCategoryChange(index, "name", e.target.value)
                          }
                          placeholder="Marketing"
                        />
                        {errors[`category_${index}_name`] && (
                          <p className="text-sm text-destructive">
                            {errors[`category_${index}_name`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Allocation <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={category.allocatedAmount || 0}
                          onChange={(e) =>
                            handleCategoryChange(
                              index,
                              "allocatedAmount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors[`category_${index}_allocatedAmount`] && (
                          <p className="text-sm text-destructive">
                            {errors[`category_${index}_allocatedAmount`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={category.description || ""}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Describe the purpose of this category"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step === 1 ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={nextStep}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={submitForm} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Budget"}
              {!isLoading && <Save className="ml-1 h-4 w-4" />}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
