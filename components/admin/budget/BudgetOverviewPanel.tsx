import React, { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/contexts/BudgetContext";
import { BudgetForm } from "@/components/budget/BudgetForm";
import {
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  PieChart,
  BarChart4,
} from "lucide-react";
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

interface BudgetOverviewPanelProps {
  startupCallId: string;
}

export default function BudgetOverviewPanel({
  startupCallId,
}: BudgetOverviewPanelProps) {
  const { toast } = useToast();
  const {
    budgets,
    isLoading,
    fetchBudgets,
    getTotalExpenseAmount,
    getRemainingBudget,
    getPercentSpent,
  } = useBudget();

  // State
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Format currency
  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Calculate budgetary stats
  const calculateStats = () => {
    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + budget.totalAmount,
      0
    );

    const totalSpent = budgets.reduce(
      (sum, budget) => sum + getTotalExpenseAmount(budget.id),
      0
    );

    const totalRemaining = budgets.reduce(
      (sum, budget) => sum + getRemainingBudget(budget.id),
      0
    );

    const activeBudgets = budgets.filter(
      (budget) => budget.status.toLowerCase() === "active"
    ).length;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      activeBudgets,
      budgetCount: budgets.length,
    };
  };

  const stats = calculateStats();

  // Handle budget form submission
  const handleBudgetSubmit = async (budget: any) => {
    setCreateSheetOpen(false);
    setEditSheetOpen(false);
    await fetchBudgets(startupCallId);
    toast({
      title: "Success",
      description: `Budget "${budget.title}" has been ${
        selectedBudget ? "updated" : "created"
      } successfully.`,
    });
  };

  // Handle budget deletion
  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    try {
      await axios.delete(
        `/api/startup-calls/${startupCallId}/budgets/${selectedBudget.id}`
      );
      await fetchBudgets(startupCallId);
      setDeleteDialogOpen(false);
      setSelectedBudget(null);
      toast({
        title: "Success",
        description: "Budget has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({
        title: "Error",
        description: "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Open edit sheet with budget data
  const openEditSheet = (budget: any) => {
    setSelectedBudget(budget);
    setEditSheetOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (budget: any) => {
    setSelectedBudget(budget);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Budget
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(stats.totalBudgeted)}
                </h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.budgetCount} budget{stats.budgetCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Budget Spent
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(stats.totalSpent)}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <BarChart4 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <Progress
              value={(stats.totalSpent / stats.totalBudgeted) * 100}
              className="h-2 mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {((stats.totalSpent / stats.totalBudgeted) * 100).toFixed(1)}% of
              total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Remaining
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(stats.totalRemaining)}
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <PieChart className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {((stats.totalRemaining / stats.totalBudgeted) * 100).toFixed(1)}%
              available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Budgets
                </p>
                <h3 className="text-2xl font-bold">{stats.activeBudgets}</h3>
              </div>
              <Button size="sm" onClick={() => setCreateSheetOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
          <CardDescription>
            Manage and track budgets for this startup call
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No budgets found</h3>
              <p className="mt-1 text-muted-foreground">
                Create a budget for this startup call to get started
              </p>
              <Button onClick={() => setCreateSheetOpen(true)} className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const spent = getTotalExpenseAmount(budget.id);
                    const remaining = getRemainingBudget(budget.id);
                    const percentSpent = getPercentSpent(budget.id);

                    return (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          {budget.title}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(budget.totalAmount, budget.currency)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(spent, budget.currency)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(remaining, budget.currency)}
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={percentSpent} className="h-2" />
                            <span className="text-xs whitespace-nowrap">
                              {percentSpent.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{budget.categories.length}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              budget.status.toLowerCase() === "active"
                                ? "default"
                                : "outline"
                            }
                          >
                            {budget.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditSheet(budget)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(budget)}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Create Budget Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Budget</SheetTitle>
            <SheetDescription>
              Create a budget for this startup call
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <BudgetForm
              startupCallId={startupCallId}
              onSubmit={handleBudgetSubmit}
              onCancel={() => setCreateSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Budget Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Budget</SheetTitle>
            <SheetDescription>Update the selected budget</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {selectedBudget && (
              <BudgetForm
                startupCallId={startupCallId}
                budget={selectedBudget}
                onSubmit={handleBudgetSubmit}
                onCancel={() => setEditSheetOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Budget Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBudget}
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
