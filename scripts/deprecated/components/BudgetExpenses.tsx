import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { Plus, Pencil, Trash, FolderIcon, CalendarIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

// Type definitions
interface Budget {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  fiscalYear: string;
  status: string;
  startupCallId: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  allocatedAmount: number;
  budgetId: string;
}

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  budgetId: string;
  categoryId?: string;
  receipt?: string;
}

const BudgetExpenses = ({
  startupCallId,
  budgets,
  onExpenseChange,
}: {
  startupCallId: string;
  budgets: Budget[];
  onExpenseChange?: () => void;
}) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Form state for the expense dialog
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: 0,
    currency: "USD",
    date: new Date(),
    budgetId: "",
    categoryId: "",
    status: "pending",
  });

  // Select the first budget by default
  useEffect(() => {
    if (budgets.length > 0 && !selectedBudget) {
      setSelectedBudget(budgets[0].id);
    }
  }, [budgets, selectedBudget]);

  // Load categories for the selected budget
  useEffect(() => {
    if (selectedBudget) {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(
            `/api/startup-calls/${startupCallId}/budgets/${selectedBudget}/categories`
          );
          setCategories(response.data);

          // Select the first category by default
          if (response.data.length > 0) {
            setSelectedCategory(response.data[0].id);
          } else {
            setSelectedCategory(null);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          toast({
            title: "Error",
            description: "Failed to fetch budget categories",
            variant: "destructive",
          });
          setCategories([]);
          setSelectedCategory(null);
        }
      };

      fetchCategories();
    }
  }, [selectedBudget, startupCallId, toast]);

  // Load expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!selectedBudget) return;

      setLoading(true);

      // Retry mechanism for handling Prisma connection issues
      let retries = 0;
      const MAX_RETRIES = 3;

      while (retries < MAX_RETRIES) {
        try {
          let url = `/api/startup-calls/${startupCallId}/budgets/${selectedBudget}/expenses`;

          if (selectedCategory) {
            url += `?categoryId=${selectedCategory}`;
          }

          if (filterStatus) {
            url += `${selectedCategory ? "&" : "?"}status=${filterStatus}`;
          }

          const response = await axios.get(url);
          setExpenses(response.data);
          setLoading(false);
          return;
        } catch (error) {
          console.error(
            `Error fetching expenses (attempt ${retries + 1}):`,
            error
          );
          retries++;

          if (retries >= MAX_RETRIES) {
            toast({
              title: "Error",
              description: "Failed to fetch expenses after multiple attempts",
              variant: "destructive",
            });
            setExpenses([]);
            setLoading(false);
            return;
          }

          // Wait before retrying
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
        }
      }
    };

    fetchExpenses();
  }, [selectedBudget, selectedCategory, filterStatus, startupCallId, toast]);

  // Handle budget selection change
  const handleBudgetChange = (budgetId: string) => {
    setSelectedBudget(budgetId);
    setSelectedCategory(null);
  };

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Open the expense dialog for creating/editing an expense
  const openExpenseDialog = (expense?: Expense) => {
    if (expense) {
      // Edit mode
      setIsEditMode(true);
      setCurrentExpense(expense);
      setExpenseForm({
        title: expense.title,
        description: expense.description || "",
        amount: expense.amount,
        currency: expense.currency,
        date: new Date(expense.date),
        budgetId: expense.budgetId,
        categoryId: expense.categoryId || "",
        status: expense.status,
      });
    } else {
      // Create mode
      setIsEditMode(false);
      setCurrentExpense(null);
      setExpenseForm({
        title: "",
        description: "",
        amount: 0,
        currency: "USD",
        date: new Date(),
        budgetId: selectedBudget || "",
        categoryId: selectedCategory || "",
        status: "pending",
      });
    }
    setExpenseDialogOpen(true);
  };

  // Close the expense dialog
  const closeExpenseDialog = () => {
    setExpenseDialogOpen(false);
  };

  // Handle form input changes
  const handleExpenseFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setExpenseForm({
      ...expenseForm,
      [name]: name === "amount" ? parseFloat(value) : value,
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setExpenseForm({
        ...expenseForm,
        date,
      });
    }
  };

  // Save expense
  const saveExpense = async () => {
    try {
      if (isEditMode && currentExpense) {
        // Update existing expense
        await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${expenseForm.budgetId}/expenses/${currentExpense.id}`,
          expenseForm
        );
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        // Create new expense
        await axios.post(
          `/api/startup-calls/${startupCallId}/budgets/${expenseForm.budgetId}/expenses`,
          expenseForm
        );
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
      }

      // Refresh the expenses list
      const response = await axios.get(
        `/api/startup-calls/${startupCallId}/budgets/${selectedBudget}/expenses`
      );
      setExpenses(response.data);

      // Notify parent component if needed
      if (onExpenseChange) {
        onExpenseChange();
      }

      // Close the dialog
      closeExpenseDialog();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
      try {
        await axios.delete(
          `/api/startup-calls/${startupCallId}/budgets/${selectedBudget}/expenses/${expenseId}`
        );

        toast({
          title: "Success",
          description: "Expense deleted successfully",
        });

        // Refresh the expenses list
        const response = await axios.get(
          `/api/startup-calls/${startupCallId}/budgets/${selectedBudget}/expenses`
        );
        setExpenses(response.data);

        // Notify parent component if needed
        if (onExpenseChange) {
          onExpenseChange();
        }

        return;
      } catch (error) {
        console.error(
          `Error deleting expense (attempt ${retries + 1}):`,
          error
        );
        retries++;

        if (retries >= MAX_RETRIES) {
          toast({
            title: "Error",
            description: "Failed to delete expense after multiple attempts",
            variant: "destructive",
          });
          return;
        }

        // Wait before retrying
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, retries)));
      }
    }
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Get the status badge color based on status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "in_review":
        return "bg-blue-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Budget and Category Selectors */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Label htmlFor="budget-select">Select Budget</Label>
            <Select
              value={selectedBudget || ""}
              onValueChange={handleBudgetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="category-select">Select Category</Label>
            <Select
              value={selectedCategory || ""}
              onValueChange={handleCategoryChange}
              disabled={!selectedBudget || categories.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select
              value={filterStatus || ""}
              onValueChange={(value) => setFilterStatus(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={() => openExpenseDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground">
                Total Expenses
              </div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalExpenses)}
              </div>
            </div>
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground">
                Number of Expenses
              </div>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </div>
            <div className="p-4 border rounded-md">
              <div className="text-sm text-muted-foreground">
                Approved Expenses
              </div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(
                  expenses
                    .filter((expense) => expense.status === "approved")
                    .reduce((sum, expense) => sum + expense.amount, 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses List</CardTitle>
          <CardDescription>
            Manage all expenses for the selected budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">
                  Loading expenses...
                </p>
              </div>
            </div>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{expense.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {expense.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find((c) => c.id === expense.categoryId)
                          ?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: expense.currency,
                        }).format(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(
                            expense.status
                          )}`}
                        >
                          {expense.status.replace("_", " ").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openExpenseDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-6">
              <FolderIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No expenses found</h3>
              <p className="text-sm text-muted-foreground">
                Add your first expense to get started.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openExpenseDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Expense" : "Create Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={expenseForm.title}
                  onChange={handleExpenseFormChange}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={expenseForm.description}
                  onChange={handleExpenseFormChange}
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={expenseForm.amount.toString()}
                  onChange={handleExpenseFormChange}
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  name="currency"
                  value={expenseForm.currency}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseForm.date
                        ? format(expenseForm.date, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expenseForm.date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={expenseForm.status}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  name="categoryId"
                  value={expenseForm.categoryId}
                  onValueChange={(value) =>
                    setExpenseForm({ ...expenseForm, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExpenseDialog}>
              Cancel
            </Button>
            <Button onClick={saveExpense}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetExpenses;
