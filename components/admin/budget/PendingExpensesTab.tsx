import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, RefreshCw, Filter, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBudget } from "@/contexts/BudgetContext";
import { format } from "date-fns";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  budgetId: string;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  status: string;
}

interface PendingExpensesTabProps {
  startupCallId: string;
}

const PendingExpensesTab: React.FC<PendingExpensesTabProps> = ({
  startupCallId,
}) => {
  const { toast } = useToast();
  const { budgets, expenses, fetchBudgets } = useBudget();

  const [loading, setLoading] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState("pending");

  // Filter expenses by status
  const getFilteredExpenses = () => {
    return expenses.filter((expense) => {
      if (tab === "pending") return expense.status === "PENDING";
      if (tab === "approved") return expense.status === "APPROVED";
      if (tab === "rejected") return expense.status === "REJECTED";
      return true; // All expenses
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Fetch expenses for all budgets in this startup call
  useEffect(() => {
    if (startupCallId) {
      fetchExpenses();
    }
  }, [startupCallId]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // We'll use the existing expenses from the BudgetContext
      const pending = expenses.filter(
        (expense) => expense.status === "PENDING"
      );
      setPendingExpenses(pending);
    } catch (error) {
      console.error("Error fetching pending expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load pending expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Handle approve expense
  const handleApprove = async () => {
    if (!selectedExpense) return;

    setProcessingId(selectedExpense.id);
    try {
      const response = await axios.patch(
        `/api/admin/expenses/${selectedExpense.id}/approve`,
        {
          status: "APPROVED",
          feedback: feedback.trim() || undefined,
        }
      );

      // Update local state
      const updatedExpense = response.data.expense;

      toast({
        title: "Expense Approved",
        description: `The expense "${selectedExpense.title}" has been approved.`,
        variant: "default",
      });

      // Refresh expenses
      fetchBudgets(startupCallId);

      // Reset state
      setFeedback("");
      setApprovalDialogOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject expense
  const handleReject = async () => {
    if (!selectedExpense) return;

    setProcessingId(selectedExpense.id);
    try {
      const response = await axios.patch(
        `/api/admin/expenses/${selectedExpense.id}/approve`,
        {
          status: "REJECTED",
          feedback: feedback.trim() || undefined,
        }
      );

      toast({
        title: "Expense Rejected",
        description: `The expense "${selectedExpense.title}" has been rejected.`,
        variant: "default",
      });

      // Refresh expenses
      fetchBudgets(startupCallId);

      // Reset state
      setFeedback("");
      setRejectionDialogOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !expenses.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Expense Approval</CardTitle>
            <CardDescription>
              Review and approve expense submissions from entrepreneurs
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => fetchBudgets(startupCallId)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                {expenses.filter((e) => e.status === "PENDING").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                {expenses.filter((e) => e.status === "APPROVED").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                {expenses.filter((e) => e.status === "REJECTED").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all">All Expenses</TabsTrigger>
          </TabsList>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                No {tab} expenses found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {tab === "pending"
                  ? "There are no pending expenses that require your approval."
                  : tab === "approved"
                  ? "No expenses have been approved yet."
                  : tab === "rejected"
                  ? "No expenses have been rejected."
                  : "No expenses found in the system."}
              </p>
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
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => {
                    // Find the budget this expense belongs to
                    const budget = budgets.find(
                      (b) => b.id === expense.budgetId
                    );

                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          {expense.category?.name || "Uncategorized"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              expense.status === "PENDING"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : expense.status === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{budget?.title || "Unknown"}</TableCell>
                        <TableCell className="text-right">
                          {expense.status === "PENDING" && (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setApprovalDialogOpen(true);
                                }}
                                disabled={processingId === expense.id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setRejectionDialogOpen(true);
                                }}
                                disabled={processingId === expense.id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Tabs>
      </CardContent>

      {/* Approve Dialog */}
      <AlertDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this expense?
              <div className="mt-4 font-medium text-foreground">
                {selectedExpense?.title} -{" "}
                {selectedExpense && formatCurrency(selectedExpense.amount)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium">
              Optional Feedback (visible to the entrepreneur)
            </label>
            <Textarea
              placeholder="Add any notes or comments about this approval"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {processingId === selectedExpense?.id ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Approve Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this expense?
              <div className="mt-4 font-medium text-foreground">
                {selectedExpense?.title} -{" "}
                {selectedExpense && formatCurrency(selectedExpense.amount)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium">
              Rejection Reason (visible to the entrepreneur)
            </label>
            <Textarea
              placeholder="Please provide a reason for rejection"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground"
            >
              {processingId === selectedExpense?.id ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Reject Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PendingExpensesTab;
