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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";

interface PendingApprovalsPanelProps {
  startupCallId: string;
}

export default function PendingApprovalsPanel({
  startupCallId,
}: PendingApprovalsPanelProps) {
  const { toast } = useToast();
  const {
    expenses,
    budgets,
    fetchExpenses,
    getCategoryById,
    updateExpenseStatus,
    isLoading,
  } = useBudget();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingExpense, setProcessingExpense] = useState<string | null>(
    null
  );

  // Filter expenses to only show pending ones
  const pendingExpenses = expenses
    .filter((expense) => {
      // Only include pending expenses
      if (expense.status.toLowerCase() !== "pending") {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          expense.title.toLowerCase().includes(query) ||
          expense.description?.toLowerCase().includes(query)
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
        description: "Pending expenses have been refreshed",
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

  // Handle approve expense
  const handleApprove = async (expenseId: string) => {
    setProcessingExpense(expenseId);
    try {
      await updateExpenseStatus(startupCallId, expenseId, "approved");
      toast({
        title: "Expense Approved",
        description: "The expense has been approved successfully",
      });
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    } finally {
      setProcessingExpense(null);
    }
  };

  // Handle reject expense
  const handleReject = async (expenseId: string) => {
    setProcessingExpense(expenseId);
    try {
      await updateExpenseStatus(startupCallId, expenseId, "rejected");
      toast({
        title: "Expense Rejected",
        description: "The expense has been rejected",
      });
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      });
    } finally {
      setProcessingExpense(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar and Refresh Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pending expenses..."
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
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pending Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Expenses awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={36} />
            </div>
          ) : pendingExpenses.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-medium text-lg">No pending expenses</h3>
              <p className="text-muted-foreground">
                All expenses have been reviewed
              </p>
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
                    <TableHead>Submitted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.map((expense) => {
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
                          {expense.createdBy?.name || "Unknown User"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewExpense(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(expense.id)}
                              disabled={processingExpense === expense.id}
                              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                            >
                              {processingExpense === expense.id ? (
                                <LoadingSpinner size={16} />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(expense.id)}
                              disabled={processingExpense === expense.id}
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                            >
                              {processingExpense === expense.id ? (
                                <LoadingSpinner size={16} />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
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

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Review expense information before approving or rejecting
            </DialogDescription>
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
                  <Label className="text-muted-foreground">Date</Label>
                  <div className="font-medium">
                    {formatDate(selectedExpense.date)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <div className="font-medium">
                    {selectedExpense.createdBy?.name || "Unknown User"}
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
                        View Receipt
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-end mt-6 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedExpense.id)}
                  disabled={processingExpense === selectedExpense.id}
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                >
                  {processingExpense === selectedExpense.id ? (
                    <LoadingSpinner size={16} className="mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedExpense.id)}
                  disabled={processingExpense === selectedExpense.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingExpense === selectedExpense.id ? (
                    <LoadingSpinner size={16} className="mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
