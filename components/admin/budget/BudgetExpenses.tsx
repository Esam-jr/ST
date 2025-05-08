import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Download,
  Edit,
  Trash,
  Search,
  Check,
  X,
  Upload,
  Filter,
} from "lucide-react";
import axios from "axios";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  receipt: string | null;
  status: string;
  categoryId: string | null;
  budgetId: string;
  category: {
    id: string;
    name: string;
    description: string | null;
    allocatedAmount: number;
    budgetId: string;
  } | null;
}

interface Budget {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  fiscalYear: string;
  status: string;
  categories: {
    id: string;
    name: string;
    description: string | null;
    allocatedAmount: number;
    budgetId: string;
  }[];
}

interface BudgetExpensesProps {
  startupCallId: string;
  budgets: Budget[];
  onExpenseChange?: () => Promise<void>;
}

const BudgetExpenses: React.FC<BudgetExpensesProps> = ({
  startupCallId,
  budgets,
  onExpenseChange,
}) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: 0,
    currency: "USD",
    date: new Date(),
    receipt: "",
    status: "pending",
    categoryId: "",
    budgetId: "",
  });

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/startup-calls/${startupCallId}/expenses`
      );
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expense data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [startupCallId]);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.description &&
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBudget =
      selectedBudget === "all" || expense.budgetId === selectedBudget;
    const matchesCategory =
      selectedCategory === "all" || expense.categoryId === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || expense.status === selectedStatus;

    return matchesSearch && matchesBudget && matchesCategory && matchesStatus;
  });

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setExpenseForm({
      ...expenseForm,
      [field]: value,
    });
  };

  // Open expense dialog
  const openExpenseDialog = (expense?: Expense) => {
    if (expense) {
      // Edit mode
      setIsEditMode(true);
      setExpenseToEdit(expense);
      setExpenseForm({
        title: expense.title,
        description: expense.description || "",
        amount: expense.amount,
        currency: expense.currency,
        date: new Date(expense.date),
        receipt: expense.receipt || "",
        status: expense.status,
        categoryId: expense.categoryId || "",
        budgetId: expense.budgetId,
      });
    } else {
      // Create mode
      setIsEditMode(false);
      setExpenseToEdit(null);
      setExpenseForm({
        title: "",
        description: "",
        amount: 0,
        currency: "USD",
        date: new Date(),
        receipt: "",
        status: "pending",
        categoryId: "",
        budgetId: budgets.length > 0 ? budgets[0].id : "",
      });
    }
    setExpenseDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !expenseForm.title ||
      expenseForm.amount <= 0 ||
      !expenseForm.budgetId
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = {
        ...expenseForm,
        date: format(expenseForm.date, "yyyy-MM-dd"),
      };

      if (isEditMode && expenseToEdit) {
        // Update expense
        await axios.put(
          `/api/startup-calls/${startupCallId}/expenses/${expenseToEdit.id}`,
          formData
        );
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        // Create expense
        await axios.post(
          `/api/startup-calls/${startupCallId}/expenses`,
          formData
        );
        toast({
          title: "Success",
          description: "Expense added successfully",
        });
      }

      // Refresh expenses and close dialog
      fetchExpenses();
      setExpenseDialogOpen(false);
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

    try {
      await axios.delete(
        `/api/startup-calls/${startupCallId}/expenses/${expenseId}`
      );
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-50 text-green-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-700">Rejected</Badge>;
      case "in_review":
        return <Badge className="bg-blue-50 text-blue-700">In Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Generate categories from all budgets
  const allCategories = budgets.flatMap((budget) =>
    budget.categories.map((category) => ({
      id: category.id,
      name: category.name,
      budgetId: budget.id,
      budgetTitle: budget.title,
    }))
  );

  // Export expenses as CSV
  const exportExpensesCSV = () => {
    // Headers for CSV
    const headers = [
      "Title",
      "Description",
      "Amount",
      "Currency",
      "Date",
      "Status",
      "Budget",
      "Category",
    ];

    // Transform expenses to CSV rows
    const rows = filteredExpenses.map((expense) => {
      const budget = budgets.find((b) => b.id === expense.budgetId);
      const category = expense.category
        ? expense.category.name
        : "Uncategorized";

      return [
        expense.title,
        expense.description || "",
        expense.amount.toString(),
        expense.currency,
        formatDate(expense.date),
        expense.status,
        budget ? budget.title : "Unknown",
        category,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Expenses Management</CardTitle>
              <CardDescription>
                Track and manage all expenses for startup call budgets
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportExpensesCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={() => openExpenseDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budgets</SelectItem>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.budgetTitle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const budget = budgets.find(
                      (b) => b.id === expense.budgetId
                    );
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          {expense.category
                            ? expense.category.name
                            : "Uncategorized"}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          {budget ? budget.title : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openExpenseDialog(expense)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {expense.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const updatedExpense = {
                                        ...expense,
                                        status: "approved",
                                      };
                                      openExpenseDialog(updatedExpense);
                                      handleFormChange("status", "approved");
                                      handleSubmit(
                                        new Event(
                                          "submit"
                                        ) as unknown as React.FormEvent
                                      );
                                    }}
                                  >
                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const updatedExpense = {
                                        ...expense,
                                        status: "rejected",
                                      };
                                      openExpenseDialog(updatedExpense);
                                      handleFormChange("status", "rejected");
                                      handleSubmit(
                                        new Event(
                                          "submit"
                                        ) as unknown as React.FormEvent
                                      );
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {expense.receipt && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={expense.receipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Receipt
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteExpense(expense.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </div>
        </CardFooter>
      </Card>

      {/* Expense Form Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update expense details below"
                : "Fill in the expense details below"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={expenseForm.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      handleFormChange("amount", parseFloat(e.target.value))
                    }
                    className="flex-1"
                    required
                    min="0"
                    step="0.01"
                  />
                  <Select
                    value={expenseForm.currency}
                    onValueChange={(value) =>
                      handleFormChange("currency", value)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <DatePicker
                    date={expenseForm.date}
                    setDate={(date) => handleFormChange("date", date)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receipt" className="text-right">
                  Receipt URL
                </Label>
                <Input
                  id="receipt"
                  value={expenseForm.receipt}
                  onChange={(e) => handleFormChange("receipt", e.target.value)}
                  className="col-span-3"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget" className="text-right">
                  Budget
                </Label>
                <Select
                  value={expenseForm.budgetId}
                  onValueChange={(value) => handleFormChange("budgetId", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Budget" />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={expenseForm.categoryId}
                  onValueChange={(value) =>
                    handleFormChange("categoryId", value)
                  }
                  disabled={!expenseForm.budgetId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Uncategorized</SelectItem>
                    {expenseForm.budgetId &&
                      allCategories
                        .filter(
                          (category) =>
                            category.budgetId === expenseForm.budgetId
                        )
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={expenseForm.status}
                  onValueChange={(value) => handleFormChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setExpenseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Expense" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetExpenses;
