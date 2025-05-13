import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBudget } from "@/contexts/BudgetContext";
import { BudgetForm } from "@/components/budget/BudgetForm";

interface StartupCall {
  id: string;
  title: string;
  status: string;
}

interface BudgetAllocationProps {
  initialStartupCallId?: string;
}

const BudgetAllocation: React.FC<BudgetAllocationProps> = ({
  initialStartupCallId,
}) => {
  const { toast } = useToast();
  const { budgets, fetchBudgets } = useBudget();

  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string>(
    initialStartupCallId || ""
  );
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Calculate allocation percentage
  const calculateAllocationPercentage = (allocated: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((allocated / total) * 100);
  };

  // Fetch startup calls
  useEffect(() => {
    const fetchStartupCalls = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/startup-calls");
        setStartupCalls(response.data);

        // Set the first call as selected if none is selected
        if (response.data.length > 0 && !selectedCallId) {
          setSelectedCallId(response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching startup calls:", error);
        toast({
          title: "Error",
          description: "Failed to load startup calls",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStartupCalls();
  }, [toast]);

  // Fetch budgets when selected call changes
  useEffect(() => {
    if (selectedCallId) {
      fetchBudgets(selectedCallId);
    }
  }, [selectedCallId, fetchBudgets]);

  // Handle budget creation form submission
  const handleBudgetSubmit = async (budget: any) => {
    setCreateDialogOpen(false);
    toast({
      title: "Budget Created",
      description: `Budget "${budget.title}" has been created successfully.`,
    });
    // Refresh budgets
    if (selectedCallId) {
      fetchBudgets(selectedCallId);
    }
  };

  // Handle budget edit form submission
  const handleBudgetEdit = async (budget: any) => {
    setEditDialogOpen(false);
    toast({
      title: "Budget Updated",
      description: `Budget "${budget.title}" has been updated successfully.`,
    });
    // Refresh budgets
    if (selectedCallId) {
      fetchBudgets(selectedCallId);
    }
  };

  // Handle budget deletion
  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    setLoading(true);
    try {
      await axios.delete(
        `/api/startup-calls/${selectedCallId}/budgets/${selectedBudget.id}`
      );
      toast({
        title: "Budget Deleted",
        description: `Budget "${selectedBudget.title}" has been deleted.`,
      });
      // Refresh budgets
      if (selectedCallId) {
        fetchBudgets(selectedCallId);
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedBudget(null);
    }
  };

  if (loading && !budgets.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Budget Allocation</h2>
          <p className="text-muted-foreground">
            Manage budget allocation for startup calls
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Startup Call</CardTitle>
          <CardDescription>
            Choose a startup call to manage its budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCallId}
            onValueChange={(value) => setSelectedCallId(value)}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Select a startup call" />
            </SelectTrigger>
            <SelectContent>
              {startupCalls.map((call) => (
                <SelectItem key={call.id} value={call.id}>
                  {call.title}{" "}
                  <Badge variant="outline" className="ml-2">
                    {call.status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCallId && (
        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>
              Manage budgets for the selected startup call
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No Budgets Found</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  There are no budgets allocated for this startup call yet.
                  Create a new budget to get started.
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-6"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
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
                      <TableHead>Categories</TableHead>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">
                          {budget.title}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(budget.totalAmount, budget.currency)}
                        </TableCell>
                        <TableCell>
                          {budget.categories?.length || 0} categories
                        </TableCell>
                        <TableCell>{budget.fiscalYear}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              budget.status === "active"
                                ? "bg-green-50 text-green-700"
                                : budget.status === "draft"
                                ? "bg-gray-50 text-gray-700"
                                : "bg-blue-50 text-blue-700"
                            }
                          >
                            {budget.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBudget(budget);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedBudget(budget);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCallId && budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>
              Detailed breakdown of budget categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={budgets[0]?.id}>
              <TabsList className="mb-4">
                {budgets.map((budget) => (
                  <TabsTrigger key={budget.id} value={budget.id}>
                    {budget.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {budgets.map((budget) => (
                <TabsContent key={budget.id} value={budget.id}>
                  {budget.categories && budget.categories.length > 0 ? (
                    <div className="space-y-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Allocated</TableHead>
                            <TableHead>% of Total</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budget.categories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">
                                {category.name}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  category.allocatedAmount,
                                  budget.currency
                                )}
                              </TableCell>
                              <TableCell>
                                {calculateAllocationPercentage(
                                  category.allocatedAmount,
                                  budget.totalAmount
                                )}
                                %
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {category.description || "No description"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Category Allocation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {budget.categories.map((category) => {
                              const percentage = calculateAllocationPercentage(
                                category.allocatedAmount,
                                budget.totalAmount
                              );
                              return (
                                <div key={category.id}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {category.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {formatCurrency(
                                        category.allocatedAmount,
                                        budget.currency
                                      )}{" "}
                                      ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Info className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="mt-2">
                        No categories defined for this budget
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Create a budget for the selected startup call
            </DialogDescription>
          </DialogHeader>
          {selectedCallId && (
            <BudgetForm
              startupCallId={selectedCallId}
              onSubmit={handleBudgetSubmit}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Update the selected budget</DialogDescription>
          </DialogHeader>
          {selectedCallId && selectedBudget && (
            <BudgetForm
              startupCallId={selectedCallId}
              initialData={{
                budget: selectedBudget,
                categories: selectedBudget.categories,
              }}
              onSubmit={handleBudgetEdit}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Budget Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBudget}
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetAllocation;
