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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  PieChart,
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
      try {
        setLoading(true);
        const response = await axios.get("/api/startup-calls");
        setStartupCalls(response.data);

        // Select the first call if none is selected
        if (!selectedCallId && response.data.length > 0) {
          setSelectedCallId(response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching startup calls:", error);
        toast({
          title: "Error",
          description: "Failed to fetch startup calls. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStartupCalls();
  }, []);

  // Fetch budgets when startup call changes
  useEffect(() => {
    if (selectedCallId) {
      fetchBudgets(selectedCallId);
    }
  }, [selectedCallId, fetchBudgets]);

  // Handle budget form submission
  const handleBudgetSubmit = async (budget: any) => {
    setCreateDialogOpen(false);
    await fetchBudgets(selectedCallId);
    toast({
      title: "Success",
      description: `Budget "${budget.title}" has been created successfully.`,
    });
  };

  // Handle budget edit
  const handleBudgetEdit = async (budget: any) => {
    setEditDialogOpen(false);
    await fetchBudgets(selectedCallId);
    toast({
      title: "Success",
      description: `Budget "${budget.title}" has been updated successfully.`,
    });
  };

  // Handle budget delete
  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    try {
      await axios.delete(
        `/api/startup-calls/${selectedCallId}/budgets/${selectedBudget.id}`
      );
      await fetchBudgets(selectedCallId);
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

  return (
    <div className="space-y-6">
      {/* Startup Call Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Startup Call</CardTitle>
          <CardDescription>
            Choose a startup call to manage its budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-full md:w-1/2">
              <Select
                value={selectedCallId}
                onValueChange={setSelectedCallId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a startup call" />
                </SelectTrigger>
                <SelectContent>
                  {startupCalls.map((call) => (
                    <SelectItem key={call.id} value={call.id}>
                      {call.title}{" "}
                      <Badge className="ml-2" variant="outline">
                        {call.status}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchBudgets(selectedCallId)}
              disabled={!selectedCallId || loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!selectedCallId}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Budgets</CardTitle>
              <CardDescription>
                Manage budgets for the selected startup call
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBudgets(selectedCallId)}
              disabled={!selectedCallId || loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : !selectedCallId ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a startup call to view its budgets
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No budgets found</h3>
              <p className="mt-1 text-muted-foreground">
                Create a budget for this startup call to get started
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4"
              >
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
                    <TableHead>Categories</TableHead>
                    <TableHead>Allocation</TableHead>
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
                      <TableCell>{budget.categories.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 h-2 rounded-full w-24">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${calculateAllocationPercentage(
                                  budget.allocatedAmount,
                                  budget.totalAmount
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {calculateAllocationPercentage(
                              budget.allocatedAmount,
                              budget.totalAmount
                            )}
                            %
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBudget(budget);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBudget(budget);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              router.push(
                                `/admin/startup-calls/${selectedCallId}/budgets/${budget.id}`
                              );
                            }}
                          >
                            <PieChart className="h-4 w-4" />
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

      {/* Create Budget Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          <BudgetForm
            startupCallId={selectedCallId}
            onSubmit={handleBudgetSubmit}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <BudgetForm
              startupCallId={selectedCallId}
              budget={selectedBudget}
              onSubmit={handleBudgetEdit}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Budget Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this budget? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBudget}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetAllocation;
