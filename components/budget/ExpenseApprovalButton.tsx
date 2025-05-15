import React, { useState } from "react";
import axios from "axios";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Expense } from "@/contexts/BudgetContext";
import { useToast } from "@/hooks/use-toast";

interface ExpenseApprovalButtonProps {
  expense: Expense;
  onStatusChange?: (updatedExpense: Expense) => void;
  variant?: "default" | "compact";
}

const ExpenseApprovalButton: React.FC<ExpenseApprovalButtonProps> = ({
  expense,
  onStatusChange,
  variant = "default",
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Only show controls if the expense is in PENDING status
  if (expense.status !== "PENDING") {
    return null;
  }

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    setLoading(newStatus === "APPROVED" ? "approve" : "reject");

    try {
      const response = await axios.patch(
        `/api/admin/expenses/${expense.id}/approve`,
        {
          status: newStatus,
          feedback: feedback.trim() || undefined,
        }
      );

      // Update UI with the new status
      if (onStatusChange && response.data.expense) {
        onStatusChange(response.data.expense);
      }

      // Show success message
      toast({
        title:
          newStatus === "APPROVED" ? "Expense Approved" : "Expense Rejected",
        description: `The expense "${
          expense.title
        }" has been ${newStatus.toLowerCase()}.`,
        variant: "default",
      });

      // Reset state
      setFeedback("");
      setConfirmOpen(false);
    } catch (error) {
      console.error(`Error ${newStatus.toLowerCase()}ing expense:`, error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus.toLowerCase()} expense. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Compact version for table rows or small spaces
  if (variant === "compact") {
    return (
      <div className="flex gap-1">
        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="default" className="h-7 px-2">
              Actions
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <h4 className="font-medium text-sm mb-2">Change Expense Status</h4>
            <Textarea
              placeholder="Optional feedback for the entrepreneur"
              className="mb-3 text-sm"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex justify-between mt-2">
              <Button
                size="sm"
                variant="destructive"
                className="w-[48%]"
                disabled={loading !== null}
                onClick={() => handleStatusChange("REJECTED")}
              >
                {loading === "reject" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <X className="h-3 w-3 mr-1" />
                )}
                Reject
              </Button>
              <Button
                size="sm"
                variant="default"
                className="w-[48%]"
                disabled={loading !== null}
                onClick={() => handleStatusChange("APPROVED")}
              >
                {loading === "approve" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Approve
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Default full-size version for cards
  return (
    <div className="mt-4 border-t pt-3">
      <h4 className="font-medium text-sm mb-2 text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 inline-block mr-1" />
        This expense requires your review
      </h4>

      <Textarea
        placeholder="Optional feedback for the entrepreneur"
        className="mb-3 text-sm"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      <div className="flex justify-between">
        <Button
          size="sm"
          variant="outline"
          className="w-[48%] border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={loading !== null}
          onClick={() => handleStatusChange("REJECTED")}
        >
          {loading === "reject" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1" />
          )}
          Reject
        </Button>
        <Button
          size="sm"
          variant="default"
          className="w-[48%]"
          disabled={loading !== null}
          onClick={() => handleStatusChange("APPROVED")}
        >
          {loading === "approve" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Approve
        </Button>
      </div>
    </div>
  );
};

export default ExpenseApprovalButton;
