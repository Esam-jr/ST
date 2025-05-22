import React, { useState, useEffect } from "react";
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  DollarSign,
  PlusCircle,
  FileText,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Receipt,
  Tag,
  RefreshCw,
} from "lucide-react";

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
  projectId?: string;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ projectId }) => {
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
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: 0,
    categoryId: "",
    date: new Date().toISOString().substring(0, 10),
    taskId: "none",
    milestoneId: "none",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchData();

    // Cleanup function to clear any pending timeouts
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  // Fetch data function to enable easier refreshing
  const fetchData = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);

    try {
      // Create an array of promises to fetch data in parallel
      const [
        projectResponse,
        expenseResponse,
        taskResponse,
        milestoneResponse,
      ] = await Promise.allSettled([
        axios.get("/api/entrepreneur/project"),
        axios.get("/api/entrepreneur/expenses").catch((err) => {
          console.error("Error fetching expenses:", err);
          return { status: "rejected", reason: err };
        }),
        axios.get("/api/entrepreneur/tasks").catch((err) => {
          console.error("Error fetching tasks:", err);
          return { status: "rejected", reason: err };
        }),
        axios.get("/api/entrepreneur/milestones").catch((err) => {
          console.error("Error fetching milestones:", err);
          return { status: "rejected", reason: err };
        }),
      ]);

      // Clear any existing retry timeouts if we get here
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }

      // Track if we need to retry due to connection issues
      let shouldRetry = false;

      // Handle each response individually
      if (projectResponse.status === "fulfilled") {
        // Set categories from project data with budget information
        setCategories(projectResponse.value.data.budget.categories);
      } else {
        const error =
          projectResponse.status === "rejected"
            ? (projectResponse as PromiseRejectedResult).reason
            : new Error("Unknown error");
        if (
          error?.response?.data?.code === "CONNECTION_ERROR" ||
          error?.response?.data?.code === "DB_CONNECTION_ERROR" ||
          error?.message?.includes("network")
        ) {
          shouldRetry = true;
        }
        if (!isRetry) {
          throw new Error("Failed to load project data");
        }
      }

      // Handle expenses response
      if (expenseResponse.status === "fulfilled") {
        const response = expenseResponse.value as { data: any };
        // Check if the response has the new structure (with expenses property)
        if (response?.data?.expenses) {
          const responseData = response.data;
          setExpenses(responseData.expenses);
          setCategories(responseData.categories || []);
          setBudget(responseData.budget || null);
        } else if (Array.isArray(response?.data)) {
          // Fallback for old response structure
          setExpenses(response.data);
        } else {
          console.error("Unexpected expense data format:", response?.data);
          setError(
            "Received invalid expense data format. Please try again later."
          );
          shouldRetry = true;
        }
      } else {
        console.error("Failed to load expenses:", expenseResponse.reason);
        setError("Failed to load expense data. Please try again later.");
        shouldRetry = true;
      }

      if (taskResponse.status === "fulfilled" && "data" in taskResponse.value) {
        setTasks(taskResponse.value.data || []);
      } else {
        const taskError =
          taskResponse.status === "rejected"
            ? (taskResponse as PromiseRejectedResult).reason
            : new Error("Unknown task error");

        console.warn("Could not load tasks:", taskError);
        setTasks([]);
      }

      if (
        milestoneResponse.status === "fulfilled" &&
        "data" in milestoneResponse.value
      ) {
        setMilestones(milestoneResponse.value.data || []);
      } else {
        const milestoneError =
          milestoneResponse.status === "rejected"
            ? (milestoneResponse as PromiseRejectedResult).reason
            : new Error("Unknown milestone error");

        console.warn("Could not load milestones:", milestoneError);
        setMilestones([]);
      }

      // Set up retry if needed
      if (shouldRetry && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(
          `Scheduling retry in ${delay / 1000}s (attempt ${retryCount + 1}/3)`
        );

        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchData(true);
        }, delay);

        setRetryTimeout(timeout);
      } else if (retryCount > 0 && !shouldRetry) {
        // If this was a successful retry
        toast({
          title: "Connection Restored",
          description: "Successfully connected to the database.",
          variant: "default",
        });
        setRetryCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching expense data:", err);

      // Check if error is from axios
      const errorMessage =
        err.response?.data?.message ||
        "Failed to load expense data. Please try again later.";
      const errorCode = err.response?.data?.code;

      // Set appropriate user-friendly error message
      let userMessage = errorMessage;
      let shouldRetry = false;

      if (
        errorCode === "CONNECTION_ERROR" ||
        errorCode === "DB_CONNECTION_ERROR"
      ) {
        userMessage = isRetry
          ? `Database connection issue. Retry attempt ${retryCount}/3...`
          : "Database connection issue. Will retry automatically...";
        shouldRetry = true;
      } else if (errorCode === "SCHEMA_ERROR") {
        userMessage = "System error. Our technical team has been notified.";
      } else if (err.message?.includes("Network Error")) {
        userMessage = "Network connection issue. Will retry automatically...";
        shouldRetry = true;
      }

      setError(userMessage);

      if (!isRetry) {
        toast({
          title: "Error",
          description: userMessage,
          variant: "destructive",
        });
      }

      // Initialize arrays to prevent errors
      setExpenses([]);
      setCategories([]);
      setTasks([]);
      setMilestones([]);

      // Set up retry if needed
      if (shouldRetry && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(
          `Scheduling retry in ${delay / 1000}s (attempt ${retryCount + 1}/3)`
        );

        const timeout = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchData(true);
        }, delay);

        setRetryTimeout(timeout);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      } else if (retryCount >= 3) {
        // If we've exhausted our retries, make sure loading is false
        setLoading(false);
        setError(
          "Database connection failed after multiple attempts. Please try again later."
        );
        toast({
          title: "Connection Failed",
          description:
            "Could not connect to database after several attempts. Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
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
  };

  // Format date
  const formatDate = (dateString: string) => {
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
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setNewExpense({
      ...newExpense,
      [field]: value,
    });

    // Clear error for the field
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: "",
      });
    }
  };

  // Validate expense form
  const validateExpenseForm = () => {
    const errors: Record<string, string> = {};

    if (!newExpense.title.trim()) {
      errors.title = "Title is required";
    }

    if (newExpense.amount <= 0) {
      errors.amount = "Amount must be greater than zero";
    }

    if (!newExpense.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (!newExpense.date) {
      errors.date = "Date is required";
    }

    // Check if the expense exceeds the category budget
    if (newExpense.categoryId) {
      const selectedCategory = categories.find(
        (category) => category.id === newExpense.categoryId
      );
      if (selectedCategory && newExpense.amount > selectedCategory.remaining) {
        errors.amount = `Amount exceeds remaining budget for this category (${formatCurrency(
          selectedCategory.remaining
        )})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle receipt file selection
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type and size
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setFormErrors({
          ...formErrors,
          receipt: "Only JPEG, PNG, and PDF files are allowed",
        });
        return;
      }

      if (file.size > maxSize) {
        setFormErrors({
          ...formErrors,
          receipt: "File size must be less than 5MB",
        });
        return;
      }

      setReceiptFile(file);

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setReceiptPreview(previewUrl);
      } else {
        setReceiptPreview(null);
      }

      // Clear any previous errors
      const updatedErrors = { ...formErrors };
      delete updatedErrors.receipt;
      setFormErrors(updatedErrors);
    }
  };

  // Remove receipt file
  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  };

  // Submit expense form
  const submitExpenseForm = async () => {
    if (!validateExpenseForm()) return;

    setLoading(true);
    try {
      // Convert "none" to null for the API
      const taskId = newExpense.taskId === "none" ? null : newExpense.taskId;
      const milestoneId =
        newExpense.milestoneId === "none" ? null : newExpense.milestoneId;

      // Ensure amount is a valid number
      const amount = parseFloat(newExpense.amount.toString());
      if (isNaN(amount) || amount <= 0) {
        setFormErrors({
          ...formErrors,
          amount: "Amount must be a positive number",
        });
        setLoading(false);
        return;
      }

      try {
        // Create FormData for multipart form data (file upload)
        const formData = new FormData();

        // Add form fields
        formData.append("title", newExpense.title);
        formData.append("description", newExpense.description || "");
        formData.append("amount", amount.toString());
        formData.append("categoryId", newExpense.categoryId);
        formData.append("date", newExpense.date);
        formData.append("taskId", taskId || "none");
        formData.append("milestoneId", milestoneId || "none");

        // Add receipt file if present
        if (receiptFile) {
          formData.append("receipt", receiptFile);
        }

        // Send multipart form data
        const response = await axios.post(
          "/api/entrepreneur/expenses",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // If we get a successful response, update the UI with the new expense
        const newExpenseData = response.data;

        // Check if the response already includes categoryName; if not, get it from state
        if (!newExpenseData.categoryName) {
          newExpenseData.categoryName =
            categories.find((cat) => cat.id === newExpense.categoryId)?.name ||
            "Unknown";
        }

        // Check if the response already includes task title; if not, get it from state
        if (taskId && !newExpenseData.taskTitle) {
          newExpenseData.taskTitle = tasks.find((t) => t.id === taskId)?.title;
        }

        // Check if the response already includes milestone title; if not, get it from state
        if (milestoneId && !newExpenseData.milestoneTitle) {
          newExpenseData.milestoneTitle = milestones.find(
            (m) => m.id === milestoneId
          )?.title;
        }

        setExpenses([...(expenses || []), newExpenseData]);

        // Update category spending
        setCategories(
          categories.map((category) =>
            category.id === newExpense.categoryId
              ? {
                  ...category,
                  spent: category.spent + amount,
                  remaining: category.remaining - amount,
                }
              : category
          )
        );

        toast({
          title: "Expense Added",
          description: "Your expense has been submitted for approval",
        });

        // Reset form with proper values
        setNewExpense({
          title: "",
          description: "",
          amount: 0,
          categoryId: "",
          date: new Date().toISOString().substring(0, 10),
          taskId: "none",
          milestoneId: "none",
        });
        setReceiptFile(null);
        if (receiptPreview) {
          URL.revokeObjectURL(receiptPreview);
          setReceiptPreview(null);
        }

        // Close dialog
        setCreateDialogOpen(false);
      } catch (apiError: any) {
        console.error("Error from expense API:", apiError);

        // Get the specific error details from the API response
        const errorData = apiError.response?.data;
        const errorCode = errorData?.code;
        const errorDetails = errorData?.details;

        if (errorCode === "VALIDATION_ERROR" && errorDetails) {
          // Handle field-specific validation errors
          const newFormErrors: Record<string, string> = {};

          if (errorDetails.title) newFormErrors.title = errorDetails.title;
          if (errorDetails.amount) newFormErrors.amount = errorDetails.amount;
          if (errorDetails.categoryId)
            newFormErrors.categoryId = errorDetails.categoryId;
          if (errorDetails.date) newFormErrors.date = errorDetails.date;
          if (errorDetails.receipt)
            newFormErrors.receipt = errorDetails.receipt;

          setFormErrors(newFormErrors);

          toast({
            title: "Validation Error",
            description: "Please check the form for errors",
            variant: "destructive",
          });
        } else if (errorCode === "BUDGET_EXCEEDED") {
          // Special handling for budget exceeded errors
          setFormErrors({
            ...formErrors,
            amount: `Amount exceeds remaining budget for ${
              errorDetails?.categoryName || "this category"
            } (${formatCurrency(errorDetails?.remaining || 0)})`,
          });

          toast({
            title: "Budget Exceeded",
            description: `The expense amount exceeds the remaining budget for this category`,
            variant: "destructive",
          });
        } else {
          // Generic error handling
          toast({
            title: "Error",
            description:
              errorData?.message ||
              "Failed to create expense. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error creating expense:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get filtered tasks based on milestone selection
  const getFilteredTasks = () => {
    if (!newExpense.milestoneId || newExpense.milestoneId === "none")
      return tasks || [];
    return (tasks || []).filter(
      (task) => task.milestoneId === newExpense.milestoneId
    );
  };

  // Render the expense list with receipt links
  const renderExpenseList = () => {
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
          {expenses.map((expense) => (
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
  };

  // Render the expense creation form
  const renderExpenseForm = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Expense title"
              value={newExpense.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={formErrors.title ? "border-red-500" : ""}
            />
            {formErrors.title && (
              <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about this expense"
              value={newExpense.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount || ""}
                onChange={(e) =>
                  handleInputChange("amount", parseFloat(e.target.value) || 0)
                }
                className={formErrors.amount ? "border-red-500" : ""}
              />
              {formErrors.amount && (
                <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newExpense.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                max={new Date().toISOString().substring(0, 10)}
                className={formErrors.date ? "border-red-500" : ""}
              />
              {formErrors.date && (
                <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="categoryId">Budget Category</Label>
            <Select
              value={newExpense.categoryId}
              onValueChange={(value) => handleInputChange("categoryId", value)}
            >
              <SelectTrigger
                className={formErrors.categoryId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({formatCurrency(category.remaining)}{" "}
                    remaining)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.categoryId && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.categoryId}
              </p>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <Label htmlFor="receipt">Receipt (Optional)</Label>
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
                        accept="image/jpeg,image/png,application/pdf"
                        className="sr-only"
                        onChange={handleReceiptChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 5MB
                  </p>
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
            {formErrors.receipt && (
              <p className="text-red-500 text-sm mt-1">{formErrors.receipt}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="milestoneId">Related Milestone (Optional)</Label>
              <Select
                value={newExpense.milestoneId}
                onValueChange={(value) =>
                  handleInputChange("milestoneId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="taskId">Related Task (Optional)</Label>
              <Select
                value={newExpense.taskId}
                onValueChange={(value) => handleInputChange("taskId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {getFilteredTasks().map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submitExpenseForm} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Expense"
            )}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  if (loading && (!expenses || expenses.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
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
              <LoadingSpinner />
            </div>
          ) : (
            renderExpenseList()
          )}
        </CardContent>
      </Card>

      {/* Create Expense Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to track your project spending
            </DialogDescription>
          </DialogHeader>
          {renderExpenseForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTracker;
