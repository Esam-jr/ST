import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
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
import { Plus, FileSearch, Wallet, Filter, Download } from "lucide-react";
import { useBudget, Expense } from "@/contexts/BudgetContext";
import { FilterBar } from "./FilterBar";
import { ExpenseCard } from "./ExpenseCard";
import Image from "next/image";

interface ExpenseListProps {
  startupCallId: string;
  showAddButton?: boolean;
  showBudgetFilter?: boolean;
  onAddExpense?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  startupCallId,
  showAddButton = true,
  showBudgetFilter = true,
  onAddExpense,
}) => {
  const {
    expenses,
    isLoading,
    error,
    getFilteredExpenses,
    deleteExpense,
    getTotalExpenseAmount,
    selectedBudgetId,
  } = useBudget();

  // Local state for dialogs
  const [viewReceiptExpense, setViewReceiptExpense] = useState<Expense | null>(
    null
  );
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Get filtered expenses
  const filteredExpenses = getFilteredExpenses();

  // Status options for filter
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "reimbursed", label: "Reimbursed" },
  ];

  // Handler for edit expense
  const handleEditExpense = (expense: Expense) => {
    // This would be implemented to open an expense form dialog
    // For now, we'll just log the action
    console.log("Edit expense:", expense);
  };

  // Handler for delete expense
  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteExpense(
        startupCallId,
        expenseToDelete.budgetId,
        expenseToDelete.id
      );
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // Handler for viewing receipt
  const handleViewReceipt = (expense: Expense) => {
    setViewReceiptExpense(expense);
  };

  // Format currency total
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Export expenses to CSV (placeholder)
  const exportToCSV = () => {
    console.log("Export expenses to CSV - implement this feature");
    // This would be implemented to generate and download a CSV file
  };

  // Calculate totals
  const totalAmount = getTotalExpenseAmount(selectedBudgetId || undefined);

  return (
    <div className="space-y-6">
      {/* Header with Add Expense button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-muted-foreground">
            {filteredExpenses.length} expense
            {filteredExpenses.length !== 1 ? "s" : ""} • Total:{" "}
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          {showAddButton && (
            <Button onClick={onAddExpense}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          )}

          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        showBudgetFilter={showBudgetFilter}
        showCategoryFilter={true}
        showStatusFilter={true}
        statusOptions={statusOptions}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading expenses...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="py-8 text-center border rounded-lg bg-destructive/10 text-destructive">
          <p>Error loading expenses: {error.message}</p>
          <Button variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredExpenses.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed rounded-lg">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
          <p className="mt-1 text-muted-foreground">
            {selectedBudgetId
              ? "No expenses match your filters"
              : "Select a budget to view expenses"}
          </p>
          {showAddButton && (
            <Button onClick={onAddExpense} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Expense
            </Button>
          )}
        </div>
      )}

      {/* Expense grid */}
      {!isLoading && !error && filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onViewReceipt={expense.receipt ? handleViewReceipt : undefined}
            />
          ))}
        </div>
      )}

      {/* View receipt dialog */}
      <Dialog
        open={!!viewReceiptExpense}
        onOpenChange={() => setViewReceiptExpense(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {viewReceiptExpense?.title} -{" "}
              {formatCurrency(viewReceiptExpense?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          {viewReceiptExpense?.receipt && (
            <div className="w-full overflow-hidden rounded-md border">
              {/* This would be replaced with an actual image viewer */}
              <div className="aspect-[4/5] relative bg-muted">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <FileSearch className="w-8 h-8" />
                  <span>Receipt preview would appear here</span>
                </div>
              </div>

              <div className="p-2 bg-muted/20 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  receipt.jpg
                </span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense?
              <br />
              <strong>{expenseToDelete?.title}</strong> -{" "}
              {formatCurrency(expenseToDelete?.amount || 0)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
