import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  PlusCircle,
  Filter,
  Download,
  MoreVertical,
  Eye,
  FileEdit,
  Trash2,
  Check,
  Ban,
  FileText,
  DollarSign,
  ArrowUpDown,
} from "lucide-react";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import { useBudget } from "@/contexts/BudgetContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExpenseManagementPanelProps {
  startupCallId: string;
}

export default function ExpenseManagementPanel({
  startupCallId,
}: ExpenseManagementPanelProps) {
  const { toast } = useToast();
  const {
    budgets,
    expenses,
    getBudgetById,
    isLoading,
    fetchExpenses,
    getCategoryById,
  } = useBudget();

  // State
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [viewExpenseOpen, setViewExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Format currency
  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Toggle expense selection
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  // Select all expenses
  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map((expense) => expense.id));
    }
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Apply sorting
  const sortExpenses = (expensesToSort: any[]) => {
    return [...expensesToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Filter expenses
  const filteredExpenses = sortExpenses(
    expenses.filter((expense) => {
      // Filter by search term
      const matchesSearch =
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus =
        statusFilter === "all" ||
        expense.status.toLowerCase() === statusFilter.toLowerCase();

      // Filter by budget
      const matchesBudget =
        budgetFilter === "all" || expense.budgetId === budgetFilter;

      return matchesSearch && matchesStatus && matchesBudget;
    })
  );

  // Handle expense form submission
  const handleExpenseSubmit = async (expense: any) => {
    setExpenseSheetOpen(false);
    await fetchExpenses(startupCallId);
    toast({
      title: "Success",
      description: `Expense "${expense.title}" has been ${
        selectedExpense ? "updated" : "created"
      } successfully.`,
    });
  };

  // Handle expense view
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setViewExpenseOpen(true);
  };

  // Handle expense edit
  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setExpenseSheetOpen(true);
  };

  // Handle expense delete confirmation
  const handleDeleteConfirmation = (expense: any) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  // Handle expense deletion
  const handleDeleteExpense = async () => {
    try {
      // Implement delete logic here via API
      const budgetId = selectedExpense.budgetId;
      const expenseId = selectedExpense.id;

      // ... API call to delete expense

      await fetchExpenses(startupCallId);
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
      toast({
        title: "Success",
        description: "Expense has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Export expenses as CSV
  const exportExpensesCSV = () => {
    const expensesToExport = selectedExpenses.length
      ? expenses.filter((e) => selectedExpenses.includes(e.id))
      : filteredExpenses;

    if (expensesToExport.length === 0) {
      toast({
        title: "No expenses",
        description: "There are no expenses to export.",
      });
      return;
    }

    // Create CSV content
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

    const csvContent = [
      headers.join(","),
      ...expensesToExport.map((expense) => {
        const budget = getBudgetById(expense.budgetId);
        const category = getCategoryById(expense.budgetId, expense.categoryId);

        return [
          `"${expense.title.replace(/"/g, '""')}"`,
          `"${expense.description?.replace(/"/g, '""') || ""}"`,
          expense.amount,
          expense.currency,
          expense.date,
          expense.status,
          budget ? `"${budget.title.replace(/"/g, '""')}"` : "",
          category ? `"${category.name.replace(/"/g, '""')}"` : "",
        ].join(",");
      }),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `expenses-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${expensesToExport.length} expenses exported to CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter and Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger className="w-[180px]">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Budget" />
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportExpensesCSV}
                  title="Export selected expenses"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  onClick={() => {
                    setSelectedExpense(null);
                    setExpenseSheetOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense
            {filteredExpenses.length !== 1 ? "s" : ""} found
            {selectedExpenses.length > 0 &&
              ` (${selectedExpenses.length} selected)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || statusFilter !== "all" || budgetFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create an expense to get started"}
              </p>
              <Button
                onClick={() => {
                  setSelectedExpense(null);
                  setExpenseSheetOpen(true);
                }}
                className="mt-4"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedExpenses.length === filteredExpenses.length &&
                          filteredExpenses.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all expenses"
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {sortField === "title" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === "amount" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === "date" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => {
                    const budget = getBudgetById(expense.budgetId);
                    const category = getCategoryById(
                      expense.budgetId,
                      expense.categoryId
                    );

                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedExpenses.includes(expense.id)}
                            onCheckedChange={() =>
                              toggleExpenseSelection(expense.id)
                            }
                            aria-label={`Select expense ${expense.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{budget?.title || "—"}</TableCell>
                        <TableCell>{category?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.status.toLowerCase() === "approved"
                                ? "default"
                                : expense.status.toLowerCase() === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() => handleViewExpense(expense)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <FileEdit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteConfirmation(expense)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Form Sheet */}
      <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedExpense ? "Edit Expense" : "Create New Expense"}
            </SheetTitle>
            <SheetDescription>
              {selectedExpense
                ? "Update the expense details"
                : "Create a new expense for this startup call"}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ExpenseForm
              startupCallId={startupCallId}
              expense={selectedExpense}
              onSubmit={handleExpenseSubmit}
              onCancel={() => setExpenseSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* View Expense Sheet */}
      <Sheet open={viewExpenseOpen} onOpenChange={setViewExpenseOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Expense Details</SheetTitle>
          </SheetHeader>
          {selectedExpense && (
            <div className="py-4 space-y-6">
              <div>
                <h3 className="text-lg font-medium">{selectedExpense.title}</h3>
                <p className="text-muted-foreground">
                  {formatCurrency(
                    selectedExpense.amount,
                    selectedExpense.currency
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Status
                  </span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedExpense.status.toLowerCase() === "approved"
                          ? "default"
                          : selectedExpense.status.toLowerCase() === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {selectedExpense.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Date
                  </span>
                  <p>{formatDate(selectedExpense.date)}</p>
                </div>

                {selectedExpense.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Description
                    </span>
                    <p className="whitespace-pre-wrap">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Budget
                  </span>
                  <p>{getBudgetById(selectedExpense.budgetId)?.title || "—"}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Category
                  </span>
                  <p>
                    {getCategoryById(
                      selectedExpense.budgetId,
                      selectedExpense.categoryId
                    )?.name || "—"}
                  </p>
                </div>
              </div>

              <div className="space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleEditExpense(selectedExpense)}
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewExpenseOpen(false);
                    handleDeleteConfirmation(selectedExpense);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
