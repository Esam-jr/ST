import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string;
  budgetId: string;
  startupCallId: string | null;
  startupCallTitle: string | null;
  startupId: string | null;
  startupName: string | null;
  founderName: string | null;
  founderEmail: string | null;
  founderId: string | null;
}

interface ExpenseReviewTableProps {
  startupId?: string;
  startupCallId?: string;
  defaultStatus?: string;
}

const ExpenseReviewTable: React.FC<ExpenseReviewTableProps> = ({
  startupId,
  startupCallId,
  defaultStatus = "PENDING",
}) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    defaultStatus || "PENDING"
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch expenses on component mount and when filters change
  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, startupId, startupCallId]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (startupId) params.append("startupId", startupId);
      if (startupCallId) params.append("startupCallId", startupCallId);

      const response = await axios.get(
        `/api/admin/expenses?${params.toString()}`
      );
      setExpenses(response.data.expenses);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load expenses. Please try again later."
      );
      toast({
        title: "Error",
        description: "Failed to load expenses for review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setFeedbackText("");
    setReviewDialogOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedExpense) return;

    setProcessingId(selectedExpense.id);
    try {
      const response = await axios.patch(
        `/api/admin/expenses/${selectedExpense.id}/status`,
        {
          status: newStatus,
          feedback: feedbackText,
        }
      );

      // Update the expense status in the local state
      setExpenses(
        expenses.map((exp) =>
          exp.id === selectedExpense.id ? { ...exp, status: newStatus } : exp
        )
      );

      toast({
        title: `Expense ${newStatus.toLowerCase()}`,
        description: `The expense has been ${newStatus.toLowerCase()} successfully.`,
        variant: newStatus === "APPROVED" ? "default" : "destructive",
      });

      // Close the dialog
      setReviewDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating expense status:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          `Failed to ${newStatus.toLowerCase()} the expense.`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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

  if (loading && expenses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="mt-4 text-lg font-medium">Failed to Load Expenses</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            {error}
          </p>
          <Button onClick={fetchExpenses} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expense Review</h2>
          <p className="text-muted-foreground">
            Review and manage expense submissions
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="">All Statuses</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={fetchExpenses}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No Expenses Found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              {statusFilter
                ? `There are no ${statusFilter.toLowerCase()} expenses to review.`
                : "There are no expenses to review at the moment."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entrepreneur</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {expense.founderName || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {expense.startupName || "Unknown Startup"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[200px] truncate font-medium">
                                {expense.title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-normal">
                                {expense.description || expense.title}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{expense.categoryName}</TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap">
                          {formatDate(expense.date)}
                        </span>
                      </TableCell>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReviewClick(expense)}
                          disabled={processingId === expense.id}
                        >
                          {processingId === expense.id ? (
                            <LoadingSpinner className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4 mr-1" />
                          )}
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Expense</DialogTitle>
            <DialogDescription>
              Review the expense details and approve or reject it.
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Title</p>
                  <p className="text-sm">{selectedExpense.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm">
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm">
                  {selectedExpense.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">{selectedExpense.categoryName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{formatDate(selectedExpense.date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Entrepreneur</p>
                  <p className="text-sm">{selectedExpense.founderName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Startup</p>
                  <p className="text-sm">{selectedExpense.startupName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Current Status</p>
                <Badge
                  variant="outline"
                  className={
                    selectedExpense.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : selectedExpense.status === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : selectedExpense.status === "REJECTED"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-700"
                  }
                >
                  {selectedExpense.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium">Feedback (optional)</p>
                <Textarea
                  placeholder="Add feedback or reason for rejection..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="space-x-2">
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("REJECTED")}
                disabled={processingId !== null}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={() => handleStatusChange("APPROVED")}
                disabled={processingId !== null}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
            <DialogClose asChild>
              <Button variant="outline" disabled={processingId !== null}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseReviewTable;
