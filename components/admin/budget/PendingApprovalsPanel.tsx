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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/contexts/BudgetContext";
import {
  Search,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface PendingApprovalsPanelProps {
  startupCallId: string;
}

export default function PendingApprovalsPanel({
  startupCallId,
}: PendingApprovalsPanelProps) {
  const { toast } = useToast();
  const { budgets, getBudgetById, getCategoryById } = useBudget();

  // State
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkActionType, setBulkActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch pending expenses
  const fetchPendingExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/startup-calls/${startupCallId}/expenses?status=pending`
      );
      setPendingExpenses(response.data);
    } catch (error) {
      console.error("Error fetching pending expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (startupCallId) {
      fetchPendingExpenses();
    }
  }, [startupCallId]);

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
    pendingExpenses.filter(
      (expense) =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

  // View expense details
  const handleViewExpenseDetails = (expense: any) => {
    setSelectedExpense(expense);
    setDetailsSheetOpen(true);
  };

  // Open approve dialog
  const handleApproveClick = (expense: any = null) => {
    if (expense) {
      setSelectedExpense(expense);
      setSelectedExpenses([expense.id]);
    }
    setApproveDialogOpen(true);
  };

  // Open reject dialog
  const handleRejectClick = (expense: any = null) => {
    if (expense) {
      setSelectedExpense(expense);
      setSelectedExpenses([expense.id]);
    }
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handle bulk actions
  const handleBulkAction = (action: "approve" | "reject") => {
    if (selectedExpenses.length === 0) {
      toast({
        title: "No expenses selected",
        description: "Please select at least one expense",
      });
      return;
    }

    setBulkActionType(action);
    if (action === "approve") {
      setApproveDialogOpen(true);
    } else {
      setRejectionReason("");
      setRejectDialogOpen(true);
    }
  };

  // Process approval
  const handleApprove = async () => {
    if (selectedExpenses.length === 0) return;

    setIsLoading(true);
    try {
      // Make API call(s) to approve expenses
      await Promise.all(
        selectedExpenses.map((expenseId) =>
          axios.patch(`/api/expenses/${expenseId}`, {
            status: "approved",
          })
        )
      );

      // Update UI and show success message
      await fetchPendingExpenses();
      setApproveDialogOpen(false);
      setBulkActionType(null);
      setSelectedExpenses([]);

      toast({
        title: "Success",
        description: `${selectedExpenses.length} expense${
          selectedExpenses.length !== 1 ? "s" : ""
        } approved successfully.`,
      });
    } catch (error) {
      console.error("Error approving expenses:", error);
      toast({
        title: "Error",
        description: "Failed to approve expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process rejection
  const handleReject = async () => {
    if (selectedExpenses.length === 0) return;

    setIsLoading(true);
    try {
      // Make API call(s) to reject expenses
      await Promise.all(
        selectedExpenses.map((expenseId) =>
          axios.patch(`/api/expenses/${expenseId}`, {
            status: "rejected",
            rejectionReason: rejectionReason.trim() || "Rejected by admin",
          })
        )
      );

      // Update UI and show success message
      await fetchPendingExpenses();
      setRejectDialogOpen(false);
      setBulkActionType(null);
      setSelectedExpenses([]);
      setRejectionReason("");

      toast({
        title: "Success",
        description: `${selectedExpenses.length} expense${
          selectedExpenses.length !== 1 ? "s" : ""
        } rejected successfully.`,
      });
    } catch (error) {
      console.error("Error rejecting expenses:", error);
      toast({
        title: "Error",
        description: "Failed to reject expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Pending Approvals</h3>
              <p className="text-muted-foreground mt-1">
                {pendingExpenses.length} expense
                {pendingExpenses.length !== 1 ? "s" : ""} awaiting review
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                onClick={fetchPendingExpenses}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleBulkAction("approve")}
                disabled={selectedExpenses.length === 0 || isLoading}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleBulkAction("reject")}
                disabled={selectedExpenses.length === 0 || isLoading}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg mx-6 my-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">
                No pending expenses
              </h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search"
                  : "All expenses have been reviewed"}
              </p>
              <Button
                variant="outline"
                onClick={fetchPendingExpenses}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Category</TableHead>
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
                        <TableCell>{expense.submittedBy || "—"}</TableCell>
                        <TableCell>{budget?.title || "—"}</TableCell>
                        <TableCell>{category?.name || "—"}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewExpenseDetails(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveClick(expense)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectClick(expense)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Expense Details Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Expense Details</SheetTitle>
            <SheetDescription>
              Review expense information before approving or rejecting
            </SheetDescription>
          </SheetHeader>

          {selectedExpense && (
            <div className="py-6 space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{selectedExpense.title}</h3>
                <div className="flex items-center">
                  <Badge className="bg-amber-500">Pending</Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    Submitted on {formatDate(selectedExpense.date)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Amount
                  </span>
                  <p className="text-xl font-semibold">
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency
                    )}
                  </p>
                </div>

                {selectedExpense.submittedBy && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Submitted By
                    </span>
                    <p>{selectedExpense.submittedBy}</p>
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

                {selectedExpense.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Description
                    </span>
                    <p className="whitespace-pre-wrap mt-1 text-sm">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}

                {/* Potentially show attachments here */}

                {selectedExpense.notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Additional Notes
                    </span>
                    <p className="whitespace-pre-wrap mt-1 text-sm">
                      {selectedExpense.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setDetailsSheetOpen(false);
                    handleApproveClick(selectedExpense);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setDetailsSheetOpen(false);
                    handleRejectClick(selectedExpense);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedExpenses.length > 1
                ? `Are you sure you want to approve ${selectedExpenses.length} expenses?`
                : "Are you sure you want to approve this expense?"}
              <br />
              This will update the expense status and notify the submitter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isLoading ? "Processing..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedExpenses.length > 1
                ? `Are you sure you want to reject ${selectedExpenses.length} expenses?`
                : "Are you sure you want to reject this expense?"}
              <br />
              Please provide a reason for the rejection. This will be shared
              with the submitter.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Processing..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
