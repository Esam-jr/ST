import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Receipt, Edit, Trash, FileText, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense, BudgetCategory } from "@/contexts/BudgetContext";

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onViewReceipt?: (expense: Expense) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete,
  onViewReceipt,
}) => {
  // Format date as a relative time (e.g., "2 days ago")
  const formattedDate = formatDistanceToNow(new Date(expense.date), {
    addSuffix: true,
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      case "reimbursed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Reimbursed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{expense.title}</CardTitle>
          {getStatusBadge(expense.status)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <span className="mr-3">{formattedDate}</span>
          {expense.category && (
            <Badge variant="secondary" className="font-normal">
              {expense.category.name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {expense.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {expense.description}
          </p>
        )}

        <div className="mt-2">
          <span className="text-xl font-semibold">
            {formatCurrency(expense.amount, expense.currency)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t bg-muted/20 flex justify-between">
        <div className="flex gap-1">
          {expense.receipt && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onViewReceipt && onViewReceipt(expense)}
            >
              <Receipt className="h-3.5 w-3.5 mr-1" />
              Receipt
            </Button>
          )}
        </div>

        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onEdit(expense)}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive"
              onClick={() => onDelete(expense)}
            >
              <Trash className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
