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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Eye,
  MoreVertical,
  Search,
  RefreshCcw,
  Check,
  X,
  Download,
  FileText,
} from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
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
    updateExpenseStatus,
    isLoading,
  } = useBudget();

  const [selectedBudgetId, setSelectedBudgetId] = useState<string | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter expenses based on selected budget and search query
  const filteredExpenses = expenses
    .filter((expense) => {
      // Filter by selected budget
      if (selectedBudgetId !== "all" && expense.budgetId !== selectedBudgetId) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          expense.title.toLowerCase().includes(query) ||
          expense.description?.toLowerCase().includes(query) ||
          expense.status.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchExpenses(startupCallId);
      toast({
        title: "Refreshed",
        description: "Expenses data has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing expenses:", error);
      toast({
        title: "Error",
        description: "Failed to refresh expenses",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle view expense details
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  // Handle expense status update
  const handleStatusUpdate = async (expenseId: string, newStatus: string) => {
    try {
      await updateExpenseStatus(startupCallId, expenseId, newStatus);
      toast({
        title: "Status Updated",
        description: `Expense status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating expense status:", error);
      toast({
        title: "Error",
        description: "Failed to update expense status",
        variant: "destructive",
      });
    }
  };

  // Get status badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "destructive";
      case "draft":
        return "outline";
      default:
        return "secondary";
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
            disabled={refreshing}
          >
            {refreshing ? (
              <LoadingSpinner size={16} />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedBudgetId}
            onValueChange={(value) => setSelectedBudgetId(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by budget" />
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            Create Expense
          </Button>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Manage and approve expenses for this startup call
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={36} />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No expenses found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => {
                    // Find the budget for this expense
                    const budget = budgets.find(
                      (b) => b.id === expense.budgetId
                    );

                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            expense.amount,
                            expense.currency || "USD"
                          )}
                        </TableCell>
                        <TableCell>
                          {budget?.title || "Unknown Budget"}
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewExpense(expense)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Status update options */}
                              {expense.status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(expense.id, "approved")
                                  }
                                >
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                              )}

                              {expense.status !== "rejected" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(expense.id, "rejected")
                                  }
                                >
                                  <X className="mr-2 h-4 w-4 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              )}

                              {(expense.status === "approved" ||
                                expense.status === "rejected") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(expense.id, "pending")
                                  }
                                >
                                  <RefreshCcw className="mr-2 h-4 w-4" />
                                  Reset to Pending
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Edit and Delete options */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              {expense.receipt && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.open(expense.receipt, "_blank");
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Receipt
                                </DropdownMenuItem>
                              )}
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

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <div className="font-medium">{selectedExpense.title}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="font-medium">
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency || "USD"
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusBadge(selectedExpense.status)}>
                      {selectedExpense.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <div className="font-medium">
                    {formatDate(selectedExpense.date)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="mt-1 text-sm">
                  {selectedExpense.description || "No description provided"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Budget</Label>
                  <div className="font-medium">
                    {budgets.find((b) => b.id === selectedExpense.budgetId)
                      ?.title || "Unknown Budget"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <div className="font-medium">
                    {getCategoryById(
                      selectedExpense.budgetId,
                      selectedExpense.categoryId
                    )?.name || "Unknown Category"}
                  </div>
                </div>
              </div>

              {selectedExpense.receipt && (
                <div>
                  <Label className="text-muted-foreground">Receipt</Label>
                  <div className="mt-2">
                    <a
                      href={selectedExpense.receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between mt-6">
                <div className="flex gap-2">
                  {selectedExpense.status !== "approved" && (
                    <Button
                      onClick={() =>
                        handleStatusUpdate(selectedExpense.id, "approved")
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {selectedExpense.status !== "rejected" && (
                    <Button
                      onClick={() =>
                        handleStatusUpdate(selectedExpense.id, "rejected")
                      }
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Expense Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Expense</DialogTitle>
            <DialogDescription>
              Create a new expense for this startup call
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            startupCallId={startupCallId}
            onSubmit={(data) => {
              toast({
                title: "Expense Created",
                description: "The expense has been created successfully",
              });
              setCreateDialogOpen(false);
              handleRefresh();
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <ExpenseForm
              startupCallId={startupCallId}
              expense={selectedExpense}
              onSubmit={(data) => {
                toast({
                  title: "Expense Updated",
                  description: "The expense has been updated successfully",
                });
                setEditDialogOpen(false);
                handleRefresh();
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
