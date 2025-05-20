import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  Receipt,
  Download,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function ExpenseTrackingPanel() {
  // State for expenses, filters, and UI
  const [expenses, setExpenses] = useState<any[]>([]);
  const [startupCalls, setStartupCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startupCallId: "",
    status: "",
    startupId: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  // Load expense data from the API
  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.startupCallId)
        params.append("startupCallId", filters.startupCallId);
      if (filters.status) params.append("status", filters.status);
      if (filters.startupId) params.append("startupId", filters.startupId);

      const response = await axios.get(
        `/api/admin/expenses?${params.toString()}`
      );
      setExpenses(response.data.expenses || []);
      setStartupCalls(response.data.startupCalls || []);

      toast({
        title: "Expenses loaded",
        description: `Loaded ${response.data.expenses?.length || 0} expenses`,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      expense.title?.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      expense.startupCall?.title?.toLowerCase().includes(query) ||
      expense.categoryName?.toLowerCase().includes(query)
    );
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle expense approval
  const handleApproveExpense = async () => {
    try {
      const response = await axios.patch(`/api/admin/expenses`, {
        id: selectedExpense.id,
        status: "APPROVED",
      });

      toast({
        title: "Expense Approved",
        description: "The expense has been approved successfully.",
      });

      // Update expense in the list
      setExpenses((prevExpenses) =>
        prevExpenses.map((exp) =>
          exp.id === selectedExpense.id ? { ...exp, status: "APPROVED" } : exp
        )
      );

      setApproveDialogOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle expense rejection
  const handleRejectExpense = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.patch(`/api/admin/expenses`, {
        id: selectedExpense.id,
        status: "REJECTED",
        rejectionReason,
      });

      toast({
        title: "Expense Rejected",
        description: "The expense has been rejected successfully.",
      });

      // Update expense in the list
      setExpenses((prevExpenses) =>
        prevExpenses.map((exp) =>
          exp.id === selectedExpense.id ? { ...exp, status: "REJECTED" } : exp
        )
      );

      setRejectDialogOpen(false);
      setSelectedExpense(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render action buttons based on expense status
  const renderActionButtons = (expense: any) => {
    if (expense.status === "PENDING") {
      return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setSelectedExpense(expense);
              setApproveDialogOpen(true);
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedExpense(expense);
              setRejectDialogOpen(true);
            }}
          >
            Reject
          </Button>
        </div>
      );
    } else if (expense.status === "APPROVED") {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    } else if (expense.status === "REJECTED") {
      return (
        <Badge
          className="bg-red-100 text-red-800"
          title={expense.rejectionReason || "No reason provided"}
        >
          Rejected
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
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
            onClick={fetchExpenses}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size={16} />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.startupCallId}
            onValueChange={(value) =>
              handleFilterChange("startupCallId", value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by startup call" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Startup Calls</SelectItem>
              {startupCalls.map((call) => (
                <SelectItem key={call.id} value={call.id}>
                  {call.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            View all expenses submitted by startup founders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex justify-center py-12">
              <LoadingSpinner size={40} />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No expenses found matching your criteria
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Startup Call</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell>{expense.categoryName}</TableCell>
                      <TableCell>
                        {expense.startupCall?.title || "Unknown"}
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <a
                            href={expense.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{renderActionButtons(expense)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Expense Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this expense?
              {selectedExpense && (
                <div className="mt-2 text-foreground">
                  <p>
                    <strong>{selectedExpense.title}</strong>
                  </p>
                  <p>
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency
                    )}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveExpense}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Expense Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense.
              {selectedExpense && (
                <div className="mt-2 text-foreground">
                  <p>
                    <strong>{selectedExpense.title}</strong>
                  </p>
                  <p>
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency
                    )}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectExpense}
              disabled={!rejectionReason.trim()}
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
