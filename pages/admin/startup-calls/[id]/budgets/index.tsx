import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import BudgetDashboard from "@/components/admin/budget/BudgetDashboard";
import BudgetExpenses from "@/components/admin/budget/BudgetExpenses";
import BudgetReports from "@/components/admin/budget/BudgetReports";
import { Loader2, Plus, PlusCircle, Trash } from "lucide-react";
import BudgetReportDialog from "@/components/admin/BudgetReportDialog";

// Types
interface Budget {
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
  expenses: Expense[];
}

interface BudgetCategory {
  id: string;
  name: string;
  description: string | null;
  allocatedAmount: number;
  budgetId: string;
}

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
  category: BudgetCategory | null;
}

interface StartupCall {
  id: string;
  title: string;
}

const BudgetManagement = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { id: startupCallId } = router.query;

  const [startupCall, setStartupCall] = useState<StartupCall | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Budget dialog state
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    title: "",
    description: "",
    totalAmount: 0,
    currency: "USD",
    fiscalYear: new Date().getFullYear().toString(),
    status: "active",
    categories: [{ name: "", description: "", allocatedAmount: 0 }],
  });

  // Fetch startup call details
  useEffect(() => {
    if (startupCallId) {
      axios
        .get(`/api/startup-calls/${startupCallId}`)
        .then((response) => {
          setStartupCall(response.data);
        })
        .catch((error) => {
          console.error("Error fetching startup call:", error);
          toast({
            title: "Error",
            description: "Failed to fetch startup call details",
            variant: "destructive",
          });
        });
    }
  }, [startupCallId, toast]);

  // Fetch budgets
  useEffect(() => {
    if (startupCallId) {
      fetchBudgets();
    }
  }, [startupCallId]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/startup-calls/${startupCallId}/budgets`
      );
      setBudgets(response.data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openBudgetDialog = (budget?: Budget) => {
    if (budget) {
      setIsEditMode(true);
      setSelectedBudget(budget);
      setBudgetForm({
        title: budget.title,
        description: budget.description || "",
        totalAmount: budget.totalAmount,
        currency: budget.currency,
        fiscalYear: budget.fiscalYear,
        status: budget.status,
        categories:
          budget.categories.length > 0
            ? budget.categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                description: cat.description || "",
                allocatedAmount: cat.allocatedAmount,
              }))
            : [{ name: "", description: "", allocatedAmount: 0 }],
      });
    } else {
      setIsEditMode(false);
      setSelectedBudget(null);
      setBudgetForm({
        title: "",
        description: "",
        totalAmount: 0,
        currency: "USD",
        fiscalYear: new Date().getFullYear().toString(),
        status: "draft",
        categories: [{ name: "", description: "", allocatedAmount: 0 }],
      });
    }
    setBudgetDialogOpen(true);
  };

  const addBudgetCategory = () => {
    setBudgetForm({
      ...budgetForm,
      categories: [
        ...budgetForm.categories,
        { name: "", description: "", allocatedAmount: 0 },
      ],
    });
  };

  const removeBudgetCategory = (index: number) => {
    const updatedCategories = [...budgetForm.categories];
    updatedCategories.splice(index, 1);
    setBudgetForm({
      ...budgetForm,
      categories: updatedCategories,
    });
  };

  const handleCategoryChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedCategories = [...budgetForm.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value,
    };
    setBudgetForm({
      ...budgetForm,
      categories: updatedCategories,
    });
  };

  const handleBudgetFormChange = (field: string, value: string | number) => {
    setBudgetForm({
      ...budgetForm,
      [field]: value,
    });
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!budgetForm.title || budgetForm.totalAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate that categories have names and allocated amounts
    const validCategories = budgetForm.categories.filter(
      (cat) => cat.name && cat.allocatedAmount > 0
    );

    if (validCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid category",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && selectedBudget) {
        // Update existing budget
        await axios.put(
          `/api/startup-calls/${startupCallId}/budgets/${selectedBudget.id}`,
          {
            ...budgetForm,
            categories: validCategories,
          }
        );
        toast({
          title: "Success",
          description: "Budget updated successfully",
        });
      } else {
        // Create new budget
        await axios.post(`/api/startup-calls/${startupCallId}/budgets`, {
          ...budgetForm,
          categories: validCategories,
        });
        toast({
          title: "Success",
          description: "Budget created successfully",
        });
      }

      // Refresh budgets and close dialog
      fetchBudgets();
      setBudgetDialogOpen(false);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast({
        title: "Error",
        description: "Failed to save budget",
        variant: "destructive",
      });
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this budget? This will also delete all associated expenses."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `/api/startup-calls/${startupCallId}/budgets/${budgetId}`
      );
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
      fetchBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">{startupCall?.title}</p>
        </div>
        <div className="flex space-x-2">
          <BudgetReportDialog
            startupCallId={startupCallId as string}
            budgets={budgets}
          />
          <Button onClick={() => openBudgetDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Create Budget
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BudgetDashboard
            startupCallId={startupCallId as string}
            budgets={budgets}
          />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
              <CardDescription>
                Manage all budgets for this startup call
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    No budgets have been created yet.
                  </p>
                  <Button onClick={() => openBudgetDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First
                    Budget
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          {budget.title}
                        </TableCell>
                        <TableCell>{budget.fiscalYear}</TableCell>
                        <TableCell>
                          {formatCurrency(budget.totalAmount, budget.currency)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              budget.status === "active"
                                ? "bg-green-100 text-green-800"
                                : budget.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : budget.status === "closed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {budget.status}
                          </span>
                        </TableCell>
                        <TableCell>{budget.categories.length}</TableCell>
                        <TableCell>
                          {format(new Date(budget.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBudgetDialog(budget)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteBudget(budget.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <BudgetExpenses
            startupCallId={startupCallId as string}
            budgets={budgets}
            onExpenseChange={fetchBudgets}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <BudgetReports
            startupCallId={startupCallId as string}
            budgets={budgets}
          />
        </TabsContent>
      </Tabs>

      {/* Budget Form Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Budget" : "Create Budget"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the budget details below."
                : "Fill in the details to create a new budget."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBudgetSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Budget Title *</Label>
                <Input
                  id="title"
                  value={budgetForm.title}
                  onChange={(e) =>
                    handleBudgetFormChange("title", e.target.value)
                  }
                  placeholder="Q1 2023 Marketing Budget"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalYear">Fiscal Year *</Label>
                <Input
                  id="fiscalYear"
                  value={budgetForm.fiscalYear}
                  onChange={(e) =>
                    handleBudgetFormChange("fiscalYear", e.target.value)
                  }
                  placeholder="2023"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={budgetForm.description}
                onChange={(e) =>
                  handleBudgetFormChange("description", e.target.value)
                }
                placeholder="Budget description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={budgetForm.totalAmount}
                  onChange={(e) =>
                    handleBudgetFormChange(
                      "totalAmount",
                      parseFloat(e.target.value)
                    )
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={budgetForm.currency}
                  onValueChange={(value) =>
                    handleBudgetFormChange("currency", value)
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={budgetForm.status}
                  onValueChange={(value) =>
                    handleBudgetFormChange("status", value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Budget Categories *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBudgetCategory}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Category
                </Button>
              </div>

              {budgetForm.categories.map((category, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label htmlFor={`cat-name-${index}`} className="text-xs">
                      Name
                    </Label>
                    <Input
                      id={`cat-name-${index}`}
                      value={category.name}
                      onChange={(e) =>
                        handleCategoryChange(index, "name", e.target.value)
                      }
                      placeholder="Category name"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label htmlFor={`cat-amount-${index}`} className="text-xs">
                      Allocation
                    </Label>
                    <Input
                      id={`cat-amount-${index}`}
                      type="number"
                      value={category.allocatedAmount}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "allocatedAmount",
                          parseFloat(e.target.value)
                        )
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Input
                      type="text"
                      value={budgetForm.currency}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBudgetCategory(index)}
                      disabled={budgetForm.categories.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBudgetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Budget" : "Create Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/admin/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default BudgetManagement;
