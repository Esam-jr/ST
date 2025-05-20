import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  MoreVertical,
  Search,
  RefreshCcw,
  Download,
  FileText,
  Calendar,
  Receipt,
} from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ExpenseForm from "@/components/expense/ExpenseForm";
import { formatDate, formatCurrency } from "@/lib/utils";

interface ExpenseManagementPanelProps {
  startupCallId: string;
}

export default function ExpenseManagementPanel({
  startupCallId,
}: ExpenseManagementPanelProps) {
  const { toast } = useToast();
  const {
    expenses,
    budgets,
    fetchExpenses,
    getCategoryById,
    createExpense,
    updateExpense,
  } = useBudget();

  const [selectedBudgetId, setSelectedBudgetId] = useState<string | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState(expenses);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter expenses when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExpenses(expenses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = expenses.filter(
        (expense) =>
          expense.title.toLowerCase().includes(query) ||
          (expense.description &&
            expense.description.toLowerCase().includes(query))
      );
      setFilteredExpenses(filtered);
    }
  }, [searchQuery, expenses]);

  // Refresh expenses
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchExpenses(startupCallId);
      toast({
        title: "Refreshed",
        description: "Expense list has been updated",
      });
    } catch (error) {
      console.error("Error refreshing expenses:", error);
      toast({
        title: "Error",
        description: "Failed to refresh expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // View expense details
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  // Create new expense
  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setIsDialogOpen(true);
  };

  // Edit expense
  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmitExpense = async (formData: any) => {
    try {
      if (selectedExpense) {
        // Update existing expense
        await updateExpense(
          startupCallId,
          selectedExpense.budgetId,
          selectedExpense.id,
          formData
        );
        toast({
          title: "Expense updated",
          description: "The expense has been updated successfully",
        });
      } else {
        // Create new expense
        await createExpense(startupCallId, formData.budgetId, formData);
        toast({
          title: "Expense created",
          description: "New expense has been added successfully",
        });
      }
      setIsDialogOpen(false);
      handleRefresh();
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search expenses..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size={16} />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCreateExpense}>Add Expense</Button>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            View and manage all expenses for the selected budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.title}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(expense.amount, expense.currency)}
                      </TableCell>
                      <TableCell>
                        {expense.categoryId
                          ? getCategoryById(
                              expense.budgetId,
                              expense.categoryId
                            )?.name || "Unknown"
                          : "Uncategorized"}
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <a
                            href={expense.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No receipt
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewExpense(expense)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? "Edit Expense" : "Create Expense"}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense
                ? "Update the expense details"
                : "Add a new expense to the budget"}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            expense={selectedExpense}
            onSubmit={handleSubmitExpense}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Title
                  </h4>
                  <p className="text-lg font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Amount
                  </h4>
                  <p className="text-lg font-medium">
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm">
                  {selectedExpense.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Category
                  </h4>
                  <p>
                    {selectedExpense.categoryId
                      ? getCategoryById(
                          selectedExpense.budgetId,
                          selectedExpense.categoryId
                        )?.name || "Unknown"
                      : "Uncategorized"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Date
                  </h4>
                  <p>{formatDate(selectedExpense.date)}</p>
                </div>
              </div>

              {selectedExpense.receipt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Receipt
                  </h4>
                  <div className="mt-2">
                    <a
                      href={selectedExpense.receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline" size="sm">
                        <Receipt className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="ml-2"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditExpense(selectedExpense);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
