import React, { useState, useEffect } from "react";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Check,
  X,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
    allocatedAmount: number;
  } | null;
  budget: {
    id: string;
    title: string;
    startupCallId: string;
  };
  startupName: string;
}

interface StartupInfo {
  id: string;
  name: string;
  founderId: string;
  founderName: string;
}

interface ExpenseApprovalTableProps {
  startupCallId?: string;
  onStatusUpdate?: () => void;
}

const ExpenseApprovalTable: React.FC<ExpenseApprovalTableProps> = ({
  startupCallId,
  onStatusUpdate,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [startups, setStartups] = useState<StartupInfo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [startupFilter, setStartupFilter] = useState("all");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = startupCallId
        ? `/api/admin/expenses?startupCallId=${startupCallId}`
        : `/api/admin/expenses`;

      const response = await axios.get(url);
      setExpenses(response.data.expenses);

      // Extract unique startups from response data
      if (response.data.startups) {
        setStartups(response.data.startups);
      } else {
        // Fallback to extracting startups from expenses if not provided directly
        const uniqueStartups = Array.from(
          new Set(
            response.data.expenses.map(
              (expense: Expense) => expense.startupName
            )
          )
        ).map((name) => ({
          id: name,
          name: name as string,
        }));

        setStartups(uniqueStartups);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [startupCallId]);

  useEffect(() => {
    // Apply filters
    let filtered = [...expenses];

    if (statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    if (startupFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.startupName === startupFilter
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, statusFilter, startupFilter]);

  const handleStatusChange = async (
    expenseId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      await axios.patch(`/api/admin/expenses/${expenseId}`, {
        status: newStatus,
      });

      // Update the local state
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === expenseId ? { ...expense, status: newStatus } : expense
        )
      );

      toast({
        title: `Expense ${newStatus.toLowerCase()}`,
        description: `The expense has been ${newStatus.toLowerCase()} successfully.`,
        variant: newStatus === "APPROVED" ? "default" : "destructive",
      });

      // Callback for parent component to refresh data if needed
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error(`Error ${newStatus.toLowerCase()} expense:`, error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus.toLowerCase()} the expense`,
        variant: "destructive",
      });
    }
  };

  const renderSkeletonRows = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={index}>
          {Array(7)
            .fill(0)
            .map((_, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            ))}
        </TableRow>
      ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Expense Approval</CardTitle>
            <CardDescription>
              Approve or reject pending expenses from entrepreneurs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchExpenses()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expenses</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {startups.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Filter by Startup</p>
              <Select value={startupFilter} onValueChange={setStartupFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select startup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Startups</SelectItem>
                  {startups.map((startup) => (
                    <SelectItem key={startup.id} value={startup.id}>
                      {startup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {filteredExpenses.length} expenses found
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Startup</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    No expenses found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.startupName}</TableCell>
                    <TableCell>{expense.budget.title}</TableCell>
                    <TableCell>
                      {expense.category?.name || "Uncategorized"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.title}
                    </TableCell>
                    <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {expense.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-green-600"
                              onClick={() =>
                                handleStatusChange(expense.id, "APPROVED")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600"
                              onClick={() =>
                                handleStatusChange(expense.id, "REJECTED")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 px-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Expense" : "Reject Expense"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Approve this expense and update the budget."
                : "Reject this expense with an optional reason."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {currentExpense && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Title</div>
                    <div>{currentExpense.title}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Amount</div>
                    <div>
                      {formatCurrency(
                        currentExpense.amount,
                        currentExpense.currency
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Category</div>
                    <div>
                      {currentExpense.category?.name || "Uncategorized"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Description</div>
                  <div className="text-sm text-muted-foreground">
                    {currentExpense.description || "No description provided."}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder={
                      actionType === "approve"
                        ? "Add an approval comment..."
                        : "Provide a reason for rejection..."
                    }
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleStatusUpdate}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ExpenseApprovalTable;
