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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);

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

  // Fetch all data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data function to enable easier refreshing
  const fetchData = async () => {
    setLoading(true);
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

      // Handle each response individually
      if (projectResponse.status === "fulfilled") {
        // Set categories from project data with budget information
        setCategories(projectResponse.value.data.budget.categories);
      } else {
        throw new Error("Failed to load project data");
      }

      if (expenseResponse.status === "fulfilled") {
        setExpenses(expenseResponse.value.data);
      } else {
        console.error("Error fetching expenses:", expenseResponse.reason);
        // Don't throw error here, just display a message
        toast({
          title: "Warning",
          description: "Failed to load expenses. Some data may be missing.",
          variant: "destructive",
        });
      }

      if (taskResponse.status === "fulfilled") {
        setTasks(taskResponse.value.data);
      } else {
        console.warn("Could not load tasks:", taskResponse.reason);
      }

      if (milestoneResponse.status === "fulfilled") {
        setMilestones(milestoneResponse.value.data);
      } else {
        console.warn("Could not load milestones:", milestoneResponse.reason);
      }
    } catch (err: any) {
      console.error("Error fetching expense data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load expense data. Please try again later."
      );
      toast({
        title: "Error",
        description: "Failed to load expense data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Submit expense form
  const submitExpenseForm = async () => {
    if (!validateExpenseForm()) return;

    setLoading(true);
    try {
      // Convert "none" to null for the API
      const taskId = newExpense.taskId === "none" ? null : newExpense.taskId;
      const milestoneId =
        newExpense.milestoneId === "none" ? null : newExpense.milestoneId;

      const response = await axios.post("/api/entrepreneur/expenses", {
        ...newExpense,
        taskId,
        milestoneId,
        status: "PENDING", // New expenses start as pending
      });

      // Add the new expense to state with category name
      const categoryName =
        categories.find((cat) => cat.id === newExpense.categoryId)?.name || "";

      setExpenses([
        ...expenses,
        {
          ...response.data,
          categoryName,
          taskTitle: tasks.find((t) => t.id === newExpense.taskId)?.title,
          milestoneTitle: milestones.find(
            (m) => m.id === newExpense.milestoneId
          )?.title,
        },
      ]);

      // Update category spending
      setCategories(
        categories.map((category) =>
          category.id === newExpense.categoryId
            ? {
                ...category,
                spent: category.spent + newExpense.amount,
                remaining: category.remaining - newExpense.amount,
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

      // Close dialog
      setCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating expense:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get filtered tasks based on milestone selection
  const getFilteredTasks = () => {
    if (!newExpense.milestoneId || newExpense.milestoneId === "none")
      return tasks;
    return tasks.filter((task) => task.milestoneId === newExpense.milestoneId);
  };

  if (loading && !expenses.length) {
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
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>
            Track spending across budget categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No budget categories available
                </p>
              </div>
            ) : (
              categories.map((category) => {
                const spentPercentage =
                  category.allocatedAmount > 0
                    ? (category.spent / category.allocatedAmount) * 100
                    : 0;

                return (
                  <div key={category.id}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(category.spent)} of{" "}
                        {formatCurrency(category.allocatedAmount)}
                      </span>
                    </div>
                    <Progress
                      value={spentPercentage}
                      className={`h-2 ${
                        spentPercentage > 90
                          ? "bg-red-100"
                          : spentPercentage > 75
                          ? "bg-amber-100"
                          : "bg-green-100"
                      }`}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>{spentPercentage.toFixed(1)}% used</span>
                      <span className="text-green-600">
                        {formatCurrency(category.remaining)} remaining
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>
            View and track your submitted expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No Expenses Found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                You haven't added any expenses yet. Click the "Add Expense"
                button to get started.
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-6"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Related To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.title}
                      </TableCell>
                      <TableCell>{expense.categoryName}</TableCell>
                      <TableCell>
                        {formatCurrency(expense.amount, expense.currency)}
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            expense.status === "APPROVED"
                              ? "bg-green-50 text-green-700"
                              : expense.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : expense.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                          }
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.taskTitle ? (
                          <span className="text-sm">
                            Task: {expense.taskTitle}
                          </span>
                        ) : expense.milestoneTitle ? (
                          <span className="text-sm">
                            Milestone: {expense.milestoneTitle}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Create a new expense for your project. Expenses will be pending
              until approved.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] pr-4 overflow-y-auto">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Expense title"
                  value={newExpense.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the expense"
                  value={newExpense.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-8"
                      value={newExpense.amount || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="text-sm text-red-500">{formErrors.amount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-8"
                      value={newExpense.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                    />
                  </div>
                  {formErrors.date && (
                    <p className="text-sm text-red-500">{formErrors.date}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExpense.categoryId}
                  onValueChange={(value) =>
                    handleInputChange("categoryId", value)
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
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
                  <p className="text-sm text-red-500">
                    {formErrors.categoryId}
                  </p>
                )}

                {newExpense.categoryId && (
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Budget remaining:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          categories.find(
                            (cat) => cat.id === newExpense.categoryId
                          )?.remaining || 0
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="milestone">Related Milestone (Optional)</Label>
                <Select
                  value={newExpense.milestoneId}
                  onValueChange={(value) =>
                    handleInputChange("milestoneId", value)
                  }
                >
                  <SelectTrigger id="milestone">
                    <SelectValue placeholder="Select milestone" />
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

              <div className="space-y-2">
                <Label htmlFor="task">Related Task (Optional)</Label>
                <Select
                  value={newExpense.taskId}
                  onValueChange={(value) => handleInputChange("taskId", value)}
                >
                  <SelectTrigger id="task">
                    <SelectValue placeholder="Select task" />
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
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitExpenseForm} disabled={loading}>
              {loading ? <LoadingSpinner /> : "Submit Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTracker;
