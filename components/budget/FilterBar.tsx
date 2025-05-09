import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  showBudgetFilter?: boolean;
  showCategoryFilter?: boolean;
  showStatusFilter?: boolean;
  statusOptions?: FilterOption[];
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  showBudgetFilter = true,
  showCategoryFilter = true,
  showStatusFilter = true,
  statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
  className = "",
}) => {
  const {
    budgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedStatusFilter,
    setSelectedStatusFilter,
    searchTerm,
    setSearchTerm,
    getBudgetById,
  } = useBudget();

  // Get categories for the selected budget
  const selectedBudget = selectedBudgetId
    ? getBudgetById(selectedBudgetId)
    : undefined;
  const categories = selectedBudget?.categories || [];

  // Filter count (to display how many filters are active)
  const activeFilterCount = [
    selectedBudgetId !== null && selectedBudgetId !== "all",
    selectedCategoryId !== null && selectedCategoryId !== "all",
    selectedStatusFilter !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSelectedBudgetId(null);
    setSelectedCategoryId(null);
    setSelectedStatusFilter("all");
    setSearchTerm("");
  };

  return (
    <div
      className={`flex flex-col space-y-3 p-4 rounded-lg border bg-card ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear all filters ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Budget Filter */}
        {showBudgetFilter && (
          <Select
            value={selectedBudgetId || "all"}
            onValueChange={(value) =>
              setSelectedBudgetId(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Budgets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Budgets</SelectItem>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category Filter */}
        {showCategoryFilter && (
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) =>
              setSelectedCategoryId(value === "all" ? null : value)
            }
            disabled={!selectedBudgetId || selectedBudgetId === "all"}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <Select
            value={selectedStatusFilter}
            onValueChange={setSelectedStatusFilter}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
