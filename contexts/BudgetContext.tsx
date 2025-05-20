import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axios from "axios";

// Define types
export interface Budget {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  fiscalYear: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categories: BudgetCategory[];
  expenses?: Expense[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  description: string | null;
  allocatedAmount: number;
  budgetId: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  date: string;
  receipt: string | null;
  categoryId: string | null;
  budgetId: string;
  category?: BudgetCategory | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

interface BudgetContextType {
  // Data
  budgets: Budget[];
  expenses: Expense[];
  isLoading: boolean;
  error: Error | null;

  // Filters and selection
  selectedBudgetId: string | null;
  selectedCategoryId: string | null;
  selectedStartupCallId: string | null;
  searchTerm: string;

  // Actions
  fetchBudgets: (startupCallId: string) => Promise<void>;
  fetchExpenses: (startupCallId: string) => Promise<void>;
  createBudget: (
    startupCallId: string,
    budgetData: Partial<Budget>
  ) => Promise<Budget>;
  updateBudget: (
    startupCallId: string,
    budgetId: string,
    budgetData: Partial<Budget>
  ) => Promise<Budget>;
  deleteBudget: (startupCallId: string, budgetId: string) => Promise<void>;

  // Category actions
  createCategory: (
    startupCallId: string,
    budgetId: string,
    categoryData: Partial<BudgetCategory>
  ) => Promise<BudgetCategory>;
  updateCategory: (
    startupCallId: string,
    budgetId: string,
    categoryId: string,
    categoryData: Partial<BudgetCategory>
  ) => Promise<BudgetCategory>;
  deleteCategory: (
    startupCallId: string,
    budgetId: string,
    categoryId: string
  ) => Promise<void>;

  // Expense actions
  createExpense: (
    startupCallId: string,
    budgetId: string,
    expenseData: Partial<Expense>
  ) => Promise<Expense>;
  updateExpense: (
    startupCallId: string,
    budgetId: string,
    expenseId: string,
    expenseData: Partial<Expense>
  ) => Promise<Expense>;
  deleteExpense: (
    startupCallId: string,
    budgetId: string,
    expenseId: string
  ) => Promise<void>;

  // Filter setters
  setSelectedBudgetId: (id: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedStartupCallId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;

  // Utility functions
  getFilteredExpenses: () => Expense[];
  getBudgetById: (id: string) => Budget | undefined;
  getCategoryById: (
    budgetId: string,
    categoryId: string
  ) => BudgetCategory | undefined;
  getTotalExpenseAmount: (budgetId?: string) => number;
  getRemainingBudget: (budgetId?: string) => number;
  getPercentSpent: (budgetId?: string) => number;
}

// Create context with defaults
const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Provider component
export const BudgetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // UI state
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedStartupCallId, setSelectedStartupCallId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch budgets for a startup call
  const fetchBudgets = useCallback(
    async (startupCallId: string) => {
      console.log("Fetching budgets for startup call:", startupCallId);
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `/api/startup-calls/${startupCallId}/budgets`
        );
        console.log("Budgets fetched successfully:", response.data);
        const fetchedBudgets = response.data;

        // Set the first budget as selected by default if none is selected
        if (fetchedBudgets.length > 0 && !selectedBudgetId) {
          setSelectedBudgetId(fetchedBudgets[0].id);
        }

        setBudgets(fetchedBudgets);

        // Fetch expenses for all budgets
        console.log("Fetching expenses for budgets...");
        const allExpenses: Expense[] = [];

        for (const budget of fetchedBudgets) {
          try {
            const expenseResponse = await axios.get(
              `/api/startup-calls/${startupCallId}/budgets/${budget.id}/expenses`
            );
            console.log(
              `Expenses for budget ${budget.id} fetched:`,
              expenseResponse.data
            );

            // Enrich expenses with their categories
            const enrichedExpenses = expenseResponse.data.map(
              (expense: Expense) => ({
                ...expense,
                category: expense.categoryId
                  ? (budget.categories || []).find(
                      (cat: BudgetCategory) => cat.id === expense.categoryId
                    )
                  : null,
              })
            );
            allExpenses.push(...enrichedExpenses);
          } catch (expError) {
            console.error(
              `Error fetching expenses for budget ${budget.id}:`,
              expError
            );
            // Continue with other budgets even if one fails
          }
        }

        setExpenses(allExpenses);
      } catch (err) {
        console.error("Error fetching budgets:", err);
        setError(err as Error);

        // Show more specific error information
        if (axios.isAxiosError(err)) {
          console.error("Axios error details:", {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
          });
        }

        // Set empty arrays to prevent UI from showing stale data
        setBudgets([]);
        setExpenses([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBudgetId]
  );

  // Add a utility method to fetch expenses separately
  const fetchExpenses = useCallback(
    async (startupCallId: string) => {
      console.log("Fetching all expenses for startup call:", startupCallId);
      if (!budgets.length) {
        console.log("No budgets available, skipping expense fetch");
        return;
      }

      setIsLoading(true);
      try {
        const allExpenses: Expense[] = [];

        for (const budget of budgets) {
          try {
            const expenseResponse = await axios.get(
              `/api/startup-calls/${startupCallId}/budgets/${budget.id}/expenses`
            );

            // Enrich expenses with their categories
            const enrichedExpenses = expenseResponse.data.map(
              (expense: Expense) => ({
                ...expense,
                category: expense.categoryId
                  ? (budget.categories || []).find(
                      (cat: BudgetCategory) => cat.id === expense.categoryId
                    )
                  : null,
              })
            );
            allExpenses.push(...enrichedExpenses);
          } catch (expError) {
            console.error(
              `Error fetching expenses for budget ${budget.id}:`,
              expError
            );
          }
        }

        setExpenses(allExpenses);
        console.log("All expenses fetched:", allExpenses.length);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [budgets]
  );

  // Create a new budget
  const createBudget = useCallback(
    async (
      startupCallId: string,
      budgetData: Partial<Budget>
    ): Promise<Budget> => {
      setIsLoading(true);

      try {
        const response = await axios.post(
          `/api/startup-calls/${startupCallId}/budgets`,
          budgetData
        );

        // Update local state with new budget
        setBudgets((prev) => [...prev, response.data]);

        return response.data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error creating budget:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update an existing budget
  const updateBudget = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      budgetData: Partial<Budget>
    ): Promise<Budget> => {
      setIsLoading(true);

      try {
        const response = await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}`,
          budgetData
        );

        // Update local state
        setBudgets((prev) =>
          prev.map((budget) =>
            budget.id === budgetId ? { ...budget, ...response.data } : budget
          )
        );

        return response.data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error updating budget:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete a budget
  const deleteBudget = useCallback(
    async (startupCallId: string, budgetId: string): Promise<void> => {
      setIsLoading(true);

      try {
        await axios.delete(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}`
        );

        // Update local state
        setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));
        setExpenses((prev) =>
          prev.filter((expense) => expense.budgetId !== budgetId)
        );

        // Reset selected budget if the deleted one was selected
        if (selectedBudgetId === budgetId) {
          const remainingBudgets = budgets.filter((b) => b.id !== budgetId);
          setSelectedBudgetId(
            remainingBudgets.length > 0 ? remainingBudgets[0].id : null
          );
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error deleting budget:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [budgets, selectedBudgetId]
  );

  // Create a category
  const createCategory = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      categoryData: Partial<BudgetCategory>
    ): Promise<BudgetCategory> => {
      setIsLoading(true);

      try {
        const response = await axios.post(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/categories`,
          categoryData
        );

        // Update local state
        setBudgets((prev) =>
          prev.map((budget) => {
            if (budget.id === budgetId) {
              return {
                ...budget,
                categories: [...(budget.categories || []), response.data],
              };
            }
            return budget;
          })
        );

        return response.data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error creating category:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update a category
  const updateCategory = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      categoryId: string,
      categoryData: Partial<BudgetCategory>
    ): Promise<BudgetCategory> => {
      setIsLoading(true);

      try {
        const response = await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/categories/${categoryId}`,
          categoryData
        );

        // Update local state
        setBudgets((prev) =>
          prev.map((budget) => {
            if (budget.id === budgetId) {
              return {
                ...budget,
                categories: (budget.categories || []).map((category) =>
                  category.id === categoryId
                    ? { ...category, ...response.data }
                    : category
                ),
              };
            }
            return budget;
          })
        );

        // Update category reference in expenses
        setExpenses((prev) =>
          prev.map((expense) => {
            if (expense.categoryId === categoryId) {
              return {
                ...expense,
                category: expense.category
                  ? { ...expense.category, ...response.data }
                  : response.data,
              };
            }
            return expense;
          })
        );

        return response.data;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error updating category:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete a category
  const deleteCategory = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      categoryId: string
    ): Promise<void> => {
      setIsLoading(true);

      try {
        await axios.delete(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/categories/${categoryId}`
        );

        // Update local state
        setBudgets((prev) =>
          prev.map((budget) => {
            if (budget.id === budgetId) {
              return {
                ...budget,
                categories: (budget.categories || []).filter(
                  (category) => category.id !== categoryId
                ),
              };
            }
            return budget;
          })
        );

        // Update expenses that referenced this category
        setExpenses((prev) =>
          prev.map((expense) => {
            if (expense.categoryId === categoryId) {
              return {
                ...expense,
                categoryId: null,
                category: null,
              };
            }
            return expense;
          })
        );

        // Reset selected category if the deleted one was selected
        if (selectedCategoryId === categoryId) {
          setSelectedCategoryId(null);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error deleting category:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedCategoryId]
  );

  // Create a new expense
  const createExpense = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      expenseData: Partial<Expense>
    ): Promise<Expense> => {
      setIsLoading(true);

      try {
        // Handle FormData if it's already created
        const isFormData = expenseData instanceof FormData;
        let requestData: any;

        if (isFormData) {
          // FormData already created
          requestData = expenseData;
          // Make sure budgetId is set
          if (!requestData.get("budgetId")) {
            requestData.append("budgetId", budgetId);
          }
        } else {
          // Create FormData for file upload
          requestData = new FormData();

          // Add all form data
          Object.entries(expenseData).forEach(([key, value]) => {
            if (key === "date" && value instanceof Date) {
              requestData.append(key, value.toISOString());
            } else if (key !== "receipt" || !value) {
              requestData.append(key, String(value));
            }
          });

          // Add receipt if present
          if (expenseData.receipt) {
            requestData.append("receipt", expenseData.receipt);
          }

          // Make sure budgetId is set
          if (!expenseData.budgetId) {
            requestData.append("budgetId", budgetId);
          }
        }

        const response = await axios.post(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/expenses`,
          requestData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const newExpense = response.data;

        // Enrich with category data if available
        if (newExpense.categoryId) {
          const budget = budgets.find((b) => b.id === budgetId);
          if (budget) {
            const category = (budget.categories || []).find(
              (cat: BudgetCategory) => cat.id === newExpense.categoryId
            );
            if (category) {
              newExpense.category = category;
            }
          }
        }

        // Update local state
        setExpenses((prev) => [...prev, newExpense]);

        return newExpense;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error creating expense:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [budgets]
  );

  // Update an expense
  const updateExpense = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      expenseId: string,
      expenseData: Partial<Expense>
    ): Promise<Expense> => {
      setIsLoading(true);

      try {
        // Handle FormData if it's already created
        const isFormData = expenseData instanceof FormData;
        let requestData: any;

        if (isFormData) {
          // FormData already created
          requestData = expenseData;
        } else {
          // Create FormData for file upload
          requestData = new FormData();

          // Add all form data
          Object.entries(expenseData).forEach(([key, value]) => {
            if (key === "date" && value instanceof Date) {
              requestData.append(key, value.toISOString());
            } else if (key !== "receipt" || !value) {
              requestData.append(key, String(value));
            }
          });

          // Add receipt if present
          if (expenseData.receipt) {
            requestData.append("receipt", expenseData.receipt);
          }
        }

        const response = await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/expenses/${expenseId}`,
          requestData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const updatedExpense = response.data;

        // Enrich with category data if available
        if (updatedExpense.categoryId) {
          const budget = budgets.find((b) => b.id === budgetId);
          if (budget) {
            const category = (budget.categories || []).find(
              (cat: BudgetCategory) => cat.id === updatedExpense.categoryId
            );
            if (category) {
              updatedExpense.category = category;
            }
          }
        }

        // Update local state
        setExpenses((prev) =>
          prev.map((expense) =>
            expense.id === expenseId
              ? { ...expense, ...updatedExpense }
              : expense
          )
        );

        return updatedExpense;
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error updating expense:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [budgets]
  );

  // Delete an expense
  const deleteExpense = useCallback(
    async (
      startupCallId: string,
      budgetId: string,
      expenseId: string
    ): Promise<void> => {
      setIsLoading(true);

      try {
        await axios.delete(
          `/api/startup-calls/${startupCallId}/budgets/${budgetId}/expenses/${expenseId}`
        );

        // Update local state
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== expenseId)
        );
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Error deleting expense:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Utility: Get filtered expenses based on current filters
  const getFilteredExpenses = useCallback(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        searchTerm === "" ||
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.description &&
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBudget =
        !selectedBudgetId || expense.budgetId === selectedBudgetId;

      const matchesCategory =
        !selectedCategoryId || expense.categoryId === selectedCategoryId;

      return matchesSearch && matchesBudget && matchesCategory;
    });
  }, [expenses, searchTerm, selectedBudgetId, selectedCategoryId]);

  // Utility: Get budget by ID
  const getBudgetById = useCallback(
    (id: string) => {
      return budgets.find((budget) => budget.id === id);
    },
    [budgets]
  );

  // Utility: Get category by ID
  const getCategoryById = useCallback(
    (budgetId: string, categoryId: string) => {
      const budget = budgets.find((b) => b.id === budgetId);
      if (budget) {
        return budget.categories.find((c) => c.id === categoryId);
      }
      return undefined;
    },
    [budgets]
  );

  // Utility: Calculate total expense amount for a budget
  const getTotalExpenseAmount = useCallback(
    (budgetId?: string) => {
      return expenses
        .filter((expense) => !budgetId || expense.budgetId === budgetId)
        .reduce((sum, expense) => sum + expense.amount, 0);
    },
    [expenses]
  );

  // Utility: Calculate remaining budget
  const getRemainingBudget = useCallback(
    (budgetId?: string) => {
      if (budgetId) {
        const budget = getBudgetById(budgetId);
        if (!budget) return 0;

        return budget.totalAmount - getTotalExpenseAmount(budgetId);
      } else {
        // Calculate for all budgets
        const totalBudget = budgets.reduce(
          (sum, budget) => sum + budget.totalAmount,
          0
        );
        return totalBudget - getTotalExpenseAmount();
      }
    },
    [budgets, getBudgetById, getTotalExpenseAmount]
  );

  // Utility: Calculate percent spent
  const getPercentSpent = useCallback(
    (budgetId?: string) => {
      if (budgetId) {
        const budget = getBudgetById(budgetId);
        if (!budget || budget.totalAmount === 0) return 0;

        return Math.round(
          (getTotalExpenseAmount(budgetId) / budget.totalAmount) * 100
        );
      } else {
        // Calculate for all budgets
        const totalBudget = budgets.reduce(
          (sum, budget) => sum + budget.totalAmount,
          0
        );
        if (totalBudget === 0) return 0;

        return Math.round((getTotalExpenseAmount() / totalBudget) * 100);
      }
    },
    [budgets, getBudgetById, getTotalExpenseAmount]
  );

  const contextValue: BudgetContextType = {
    // Data
    budgets,
    expenses,
    isLoading,
    error,

    // Filters and selection
    selectedBudgetId,
    selectedCategoryId,
    selectedStartupCallId,
    searchTerm,

    // Actions
    fetchBudgets,
    fetchExpenses,
    createBudget,
    updateBudget,
    deleteBudget,

    // Category actions
    createCategory,
    updateCategory,
    deleteCategory,

    // Expense actions
    createExpense,
    updateExpense,
    deleteExpense,

    // Filter setters
    setSelectedBudgetId,
    setSelectedCategoryId,
    setSelectedStartupCallId,
    setSearchTerm,

    // Utility functions
    getFilteredExpenses,
    getBudgetById,
    getCategoryById,
    getTotalExpenseAmount,
    getRemainingBudget,
    getPercentSpent,
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};

// Custom hook for using the budget context
export const useBudget = () => {
  const context = useContext(BudgetContext);

  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }

  return context;
};
