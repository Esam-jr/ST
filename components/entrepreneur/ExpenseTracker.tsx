import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  DollarSign,
  PlusCircle,
  FileText,
  Calendar as CalendarIcon,
  AlertTriangle,
  AlertCircle,
  Receipt,
  Tag,
  RefreshCw,
} from "lucide-react";

// Types
interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  status: string;
  categoryId: string;
  categoryName: string;
  taskId?: string | null;
  milestoneId?: string | null;
  taskTitle?: string;
  milestoneTitle?: string;
  receipt?: string;
}

interface Category {
  id: string;
  name: string;
  allocatedAmount: number;
  spent: number;
  remaining: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  milestoneId?: string | null;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
}

interface ExpenseTrackerProps {
  startupId: string;
}

interface NewExpenseFormData {
  title: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  milestoneId: string;
  receipt?: File | null;
}

interface ApiError {
  message: string;
  code?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ startupId }) => {
  const { toast } = useToast();

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  // Expense form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newExpense, setNewExpense] = useState<NewExpenseFormData>({
    title: "",
    description: "",
    amount: 0,
    date: new Date(),
    categoryId: "",
    milestoneId: "",
    receipt: null,
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup function for object URLs
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  // Format currency with memoization
  const formatCurrency = useCallback((amount: number, currency: string = "USD") => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `$${amount.toFixed(2)}`;
    }
  }, []);

  // Format date with memoization
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  }, []);

  // Handle form input changes with proper typing
  const handleInputChange = <K extends keyof NewExpenseFormData>(
    field: K,
    value: NewExpenseFormData[K]
  ) => {
    setNewExpense(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Fetch all data when component mounts
  const fetchData = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);

    try {
      const [
        projectResponse,
        expenseResponse,
        taskResponse,
        milestoneResponse,
      ] = await Promise.allSettled([
        axios.get(`/api/entrepreneur/project?startupId=${startupId}`),
        axios.get(`/api/entrepreneur/expenses?startupId=${startupId}`),
        axios.get(`/api/entrepreneur/tasks?startupId=${startupId}`),
        axios.get(`/api/entrepreneur/milestones?startupId=${startupId}`),
      ]);

      // Clear any existing retry timeouts
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }

      let shouldRetry = false;

      // Process project response
      if (projectResponse.status === "fulfilled") {
        setCategories(projectResponse.value.data.budget.categories);
      } else {
        const error = projectResponse.status === "rejected" 
          ? (projectResponse as PromiseRejectedResult).reason 
          : new Error("Unknown error");
        if (error?.response?.data?.code === "CONNECTION_ERROR" || 
            error?.response?.data?.code === "DB_CONNECTION_ERROR" || 
            error?.message?.includes("network")) {
          shouldRetry = true;
        }
        if (!isRetry) {
          throw new Error("Failed to load project data");
        }
      }

      // Process expense response
      if (expenseResponse.status === "fulfilled") {
        const response = expenseResponse.value as { data: any };
        if (response?.data?.expenses) {
          const responseData = response.data;
          setExpenses(responseData.expenses);
          setCategories(prev => responseData.categories || prev);
          setBudget(responseData.budget || null);
        } else if (Array.isArray(response?.data)) {
          setExpenses(response.data);
        } else {
          console.error("Unexpected expense data format:", response?.data);
          setError("Received invalid expense data format. Please try again later.");
          shouldRetry = true;
        }
      } else {
        console.error("Failed to load expenses:", expenseResponse.reason);
        setError("Failed to load expense data. Please try again later.");
        shouldRetry = true;
      }

      // Process task response
      if (taskResponse.status === "fulfilled" && "data" in taskResponse.value) {
        setTasks(taskResponse.value.data || []);
      } else {
        const taskError = taskResponse.status === "rejected"
          ? (taskResponse as PromiseRejectedResult).reason
          : new Error("Unknown task error");
        console.warn("Could not load tasks:", taskError);
        setTasks([]);
      }

      // Process milestone response
      if (milestoneResponse.status === "fulfilled" && "data" in milestoneResponse.value) {
        setMilestones(milestoneResponse.value.data || []);
      } else {
        const milestoneError = milestoneResponse.status === "rejected"
          ? (milestoneResponse as PromiseRejectedResult).reason
          : new Error("Unknown milestone error");
        console.warn("Could not load milestones:", milestoneError);
        setMilestones([]);
      }

      // Set up retry if needed
      if (shouldRetry && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Scheduling retry in ${delay / 1000}s (attempt ${retryCount + 1}/3)`);

        const timeout = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData(true);
        }, delay);

        setRetryTimeout(timeout);
      } else if (retryCount > 0 && !shouldRetry) {
        toast({
          title: "Connection Restored",
          description: "Successfully connected to the database.",
          variant: "default",
        });
        setRetryCount(0);
      }
    } catch (err: unknown) {
      console.error("Error fetching expense data:", err);
      let errorMessage = "Failed to load expense data. Please try again later.";
      let shouldRetry = false;

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
        const errorCode = err.response?.data?.code;

        if (errorCode === "CONNECTION_ERROR" || errorCode === "DB_CONNECTION_ERROR") {
          errorMessage = isRetry
            ? `Database connection issue. Retry attempt ${retryCount}/3...`
            : "Database connection issue. Will retry automatically...";
          shouldRetry = true;
        } else if (errorCode === "SCHEMA_ERROR") {
          errorMessage = "System error. Our technical team has been notified.";
        } else if (err.message?.includes("Network Error")) {
          errorMessage = "Network connection issue. Will retry automatically...";
          shouldRetry = true;
        }
      }

      setError(errorMessage);
      setExpenses([]);
      setCategories([]);
      setTasks([]);
      setMilestones([]);

      if (!isRetry) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }

      if (shouldRetry && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount);
        const timeout = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData(true);
        }, delay);

        setRetryTimeout(timeout);
      }
    } finally {
      if (!isRetry || retryCount >= 3) {
        setLoading(false);
        if (retryCount >= 3) {
          setError("Database connection failed after multiple attempts. Please try again later.");
          toast({
            title: "Connection Failed",
            description: "Could not connect to database after several attempts. Please try again later.",
            variant: "destructive",
          });
        }
      }
    }
  }, [retryCount, retryTimeout, toast, startupId]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, startupId]);

  // Validate expense form
  const validateExpenseForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!newExpense.title.trim()) {
      errors.title = "Title is required";
    } else if (newExpense.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (newExpense.amount <= 0) {
      errors.amount = "Amount must be greater than zero";
    } else if (newExpense.amount > 1000000) {
      errors.amount = "Amount must be less than $1,000,000";
    }

    if (!newExpense.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (!newExpense.date) {
      errors.date = "Date is required";
    } else if (newExpense.date > new Date()) {
      errors.date = "Date cannot be in the future";
    }

    if (!newExpense.milestoneId) {
      errors.milestoneId = "Milestone is required";
    }

    // Check if the expense exceeds the category budget
    if (newExpense.categoryId) {
      const selectedCategory = categories.find(
        category => category.id === newExpense.categoryId
      );
      if (selectedCategory && newExpense.amount > selectedCategory.remaining) {
        errors.amount = `Amount exceeds remaining budget for this category (${formatCurrency(
          selectedCategory.remaining
        )})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newExpense, categories, formatCurrency]);

  // Handle receipt file selection
  const handleReceiptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!VALID_FILE_TYPES.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        receipt: "Only JPEG, PNG, and PDF files are allowed",
      }));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFormErrors(prev => ({
        ...prev,
        receipt: "File size must be less than 5MB",
      }));
      return;
    }

    setReceiptFile(file);
    handleInputChange("receipt", file);

    // Create preview URL for images
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
    } else {
      setReceiptPreview(null);
    }

    // Clear any previous errors
    setFormErrors(prev => {
      const updatedErrors = { ...prev };
      delete updatedErrors.receipt;
      return updatedErrors;
    });
  }, []);

  // Remove receipt file
  const handleRemoveReceipt = useCallback(() => {
    setReceiptFile(null);
    handleInputChange("receipt", null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  }, [receiptPreview]);

  // Submit expense form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateExpenseForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", newExpense.title);
      formData.append("description", newExpense.description);
      formData.append("amount", newExpense.amount.toString());
      formData.append("date", newExpense.date.toISOString());
      formData.append("categoryId", newExpense.categoryId);
      formData.append("milestoneId", newExpense.milestoneId);
      
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await axios.post("/api/entrepreneur/expenses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newExpenseData = response.data;

      setExpenses(prev => [...prev, newExpenseData]);
      setNewExpense({
        title: "",
        description: "",
        amount: 0,
        date: new Date(),
        categoryId: "",
        milestoneId: "",
        receipt: null,
      });
      setReceiptFile(null);
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
        setReceiptPreview(null);
      }
      setCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    } catch (error: unknown) {
      console.error("Error creating expense:", error);
      let errorMessage = "Failed to create expense";
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoized expense list
  const expenseList = useMemo(() => {
    if (expenses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No expenses found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map(expense => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.title}</TableCell>
              <TableCell>{expense.categoryName}</TableCell>
              <TableCell>
                {formatCurrency(expense.amount, expense.currency)}
              </TableCell>
              <TableCell>{formatDate(expense.date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    expense.status === "APPROVED"
                      ? "default"
                      : expense.status === "REJECTED"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {expense.status.charAt(0) +
                    expense.status.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {expense.receipt ? (
                  <a
                    href={expense.receipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    aria-label={`View receipt for ${expense.title}`}
                  >
                    <Receipt className="h-4 w-4 mr-1" />
                    View
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">None</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }, [expenses, formatCurrency, formatDate]);

  // Memoized budget category cards
  const budgetCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(category => (
        <Card key={category.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spent:</span>
                <span className="font-medium">
                  {formatCurrency(category.spent)} of{" "}
                  {formatCurrency(category.allocatedAmount)}
                </span>
              </div>
              <Progress
                value={(category.spent / category.allocatedAmount) * 100}
                className="h-2"
                aria-label={`${Math.round(
                  (category.spent / category.allocatedAmount) * 100
                )}% of budget spent`}
              />
              <div className="flex justify-between text-sm">
                <span>Remaining:</span>
                <span
                  className={`font-medium ${
                    category.remaining < 0 ? "text-red-500" : ""
                  }`}
                >
                  {formatCurrency(category.remaining)} remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ), [categories, formatCurrency]);

  // Expense form component
  const ExpenseForm = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Expense title"
            value={newExpense.title}
            onChange={e => handleInputChange("title", e.target.value)}
            className={formErrors.title ? "border-red-500" : ""}
            maxLength={100}
            aria-invalid={!!formErrors.title}
            aria-describedby={formErrors.title ? "title-error" : undefined}
          />
          {formErrors.title && (
            <p id="title-error" className="text-red-500 text-sm mt-1">
              {formErrors.title}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add details about this expense"
            value={newExpense.description}
            onChange={e => handleInputChange("description", e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={newExpense.amount || ""}
              onChange={e =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              className={formErrors.amount ? "border-red-500" : ""}
              aria-invalid={!!formErrors.amount}
              aria-describedby={formErrors.amount ? "amount-error" : undefined}
            />
            {formErrors.amount && (
              <p id="amount-error" className="text-red-500 text-sm mt-1">
                {formErrors.amount}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newExpense.date && "text-muted-foreground"
                  )}
                  id="date"
                  aria-invalid={!!formErrors.date}
                  aria-describedby={formErrors.date ? "date-error" : undefined}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newExpense.date ? format(newExpense.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newExpense.date}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      handleInputChange("date", date);
                    }
                  }}
                  disabled={date => date > new Date()}
                  initialFocus
                  fromDate={new Date(2020, 0, 1)}
                  toDate={new Date()}
                />
              </PopoverContent>
            </Popover>
            {formErrors.date && (
              <p id="date-error" className="text-red-500 text-sm mt-1">
                {formErrors.date}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="categoryId">Budget Category</Label>
          <Select
            value={newExpense.categoryId}
            onValueChange={value => handleInputChange("categoryId", value)}
          >
            <SelectTrigger
              className={formErrors.categoryId ? "border-red-500" : ""}
              id="categoryId"
              aria-invalid={!!formErrors.categoryId}
              aria-describedby={formErrors.categoryId ? "category-error" : undefined}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({formatCurrency(category.remaining)}{" "}
                  remaining)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.categoryId && (
            <p id="category-error" className="text-red-500 text-sm mt-1">
              {formErrors.categoryId}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="milestoneId">Related Milestone</Label>
          <Select
            value={newExpense.milestoneId}
            onValueChange={value => handleInputChange("milestoneId", value)}
          >
            <SelectTrigger
              className={formErrors.milestoneId ? "border-red-500" : ""}
              id="milestoneId"
              aria-invalid={!!formErrors.milestoneId}
              aria-describedby={formErrors.milestoneId ? "milestone-error" : undefined}
            >
              <SelectValue placeholder="Select a milestone" />
            </SelectTrigger>
            <SelectContent>
              {milestones.map(milestone => (
                <SelectItem key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.milestoneId && (
            <p id="milestone-error" className="text-red-500 text-sm mt-1">
              {formErrors.milestoneId}
            </p>
          )}
        </div>

        {/* Receipt Upload */}
        <div>
          <Label htmlFor="receipt-upload">Receipt (Optional)</Label>
          {!receiptFile ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
              <div className="space-y-1 text-center">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="receipt-upload"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Upload a receipt</span>
                    <input
                      id="receipt-upload"
                      name="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={handleReceiptChange}
                      aria-describedby={formErrors.receipt ? "receipt-error" : undefined}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF up to 5MB
                </p>
                {formErrors.receipt && (
                  <p id="receipt-error" className="text-red-500 text-sm mt-1">
                    {formErrors.receipt}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between p-2 border border-gray-300 rounded-md">
              <div className="flex items-center">
                <Receipt className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-sm truncate max-w-[200px]">
                  {receiptFile.name}
                </span>
              </div>
              <div className="flex space-x-2">
                {receiptPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(receiptPreview, "_blank")}
                  >
                    Preview
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveReceipt}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCreateDialogOpen(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        {isSubmitting ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </Button>
        ) : (
          <Button type="submit" form="expense-form">
            Create Expense
          </Button>
        )}
      </DialogFooter>
    </div>
  ), [
    newExpense,
    formErrors,
    categories,
    milestones,
    receiptFile,
    receiptPreview,
    isSubmitting,
    handleInputChange,
    handleReceiptChange,
    handleRemoveReceipt,
    formatCurrency,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin" aria-label="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expense Tracker</h2>
          <p className="text-muted-foreground">
            Track and manage your project expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchData()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Expense
          </Button>
        </div>
      </div>

      {/* Budget Category Cards */}
      {budgetCards}

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            View all expenses and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingExpenses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin" aria-label="Loading expenses..." />
            </div>
          ) : (
            expenseList
          )}
        </CardContent>
      </Card>

      {/* Create Expense Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to track your spending
            </DialogDescription>
          </DialogHeader>
          <form id="expense-form" onSubmit={handleSubmit}>
            {ExpenseForm}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTracker;