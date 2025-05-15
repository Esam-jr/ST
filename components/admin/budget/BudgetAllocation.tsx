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
  Copy,
  Save,
  FileText,
  PieChart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useBudget } from "@/contexts/BudgetContext";
import { BudgetForm } from "@/components/budget/BudgetForm";
import PendingExpensesTab from "./PendingExpensesTab";
import Image from "next/image";

interface StartupCall {
  id: string;
  title: string;
  status: string;
}

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  categories: {
    name: string;
    description: string;
    percentage: number;
  }[];
}

interface BudgetAllocationProps {
  initialStartupCallId?: string;
}

const DEFAULT_TEMPLATES: BudgetTemplate[] = [
  {
    id: "startup-standard",
    name: "Startup Standard",
    description: "A standard budget template for early-stage startups",
    categories: [
      {
        name: "Product Development",
        description: "Software/hardware development costs",
        percentage: 40,
      },
      {
        name: "Marketing",
        description: "Advertising, PR, and customer acquisition",
        percentage: 25,
      },
      {
        name: "Operations",
        description: "Office, utilities, and daily operations",
        percentage: 15,
      },
      {
        name: "Legal & Admin",
        description: "Legal fees, registrations, and admin costs",
        percentage: 10,
      },
      {
        name: "Contingency",
        description: "Emergency funds for unexpected costs",
        percentage: 10,
      },
    ],
  },
  {
    id: "tech-innovation",
    name: "Tech Innovation",
    description: "Budget template focused on R&D and innovation",
    categories: [
      {
        name: "Research & Development",
        description: "Core R&D activities",
        percentage: 50,
      },
      {
        name: "IP Protection",
        description: "Patents, trademarks, and IP management",
        percentage: 15,
      },
      {
        name: "Market Testing",
        description: "Prototype testing and market validation",
        percentage: 20,
      },
      {
        name: "Business Development",
        description: "Partnership and client acquisition",
        percentage: 10,
      },
      {
        name: "Contingency",
        description: "Buffer for unexpected research costs",
        percentage: 5,
      },
    ],
  },
  {
    id: "hardware-focus",
    name: "Hardware Focus",
    description: "Budget template for hardware-based startups",
    categories: [
      {
        name: "Prototyping",
        description: "Building and testing prototypes",
        percentage: 30,
      },
      {
        name: "Manufacturing",
        description: "Production and assembly costs",
        percentage: 30,
      },
      {
        name: "Supply Chain",
        description: "Materials and logistics",
        percentage: 20,
      },
      {
        name: "Certification",
        description: "Industry certifications and testing",
        percentage: 15,
      },
      {
        name: "Contingency",
        description: "Emergency funds for production delays",
        percentage: 5,
      },
    ],
  },
];

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
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<BudgetTemplate | null>(null);
  const [budgetTemplates, setBudgetTemplates] =
    useState<BudgetTemplate[]>(DEFAULT_TEMPLATES);
  const [customTemplateDialogOpen, setCustomTemplateDialogOpen] =
    useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<BudgetTemplate, "id">>({
    name: "",
    description: "",
    categories: [],
  });

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

  // Apply selected template to create a new budget
  const applyTemplate = (template: BudgetTemplate) => {
    // Close the template dialog
    setTemplateDialogOpen(false);

    // Open the create budget dialog with pre-filled template data
    setCreateDialogOpen(true);

    // Pass the template data to the BudgetForm component
    // The actual implementation will be in the BudgetForm component
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied. Customize as needed.`,
    });
  };

  // Save current budget as a template
  const saveBudgetAsTemplate = (budget: any) => {
    if (!budget || !budget.categories) return;

    const totalAmount = budget.totalAmount || 0;

    // Create a new template from the budget
    const newTemplate: BudgetTemplate = {
      id: `custom-${Date.now()}`,
      name: `${budget.title} Template`,
      description: `Template created from ${budget.title}`,
      categories: budget.categories.map((cat: any) => ({
        name: cat.name,
        description: cat.description || "",
        percentage: calculateAllocationPercentage(
          cat.allocatedAmount,
          totalAmount
        ),
      })),
    };

    // Add the new template to the list
    setBudgetTemplates([...budgetTemplates, newTemplate]);

    toast({
      title: "Template Created",
      description: `${newTemplate.name} has been saved for future use.`,
    });
  };

  // Handle custom template creation
  const createCustomTemplate = () => {
    // Validate the template
    if (!newTemplate.name) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (newTemplate.categories.length === 0) {
      toast({
        title: "Error",
        description: "At least one category is required",
        variant: "destructive",
      });
      return;
    }

    // Create a new template
    const customTemplate: BudgetTemplate = {
      ...newTemplate,
      id: `custom-${Date.now()}`,
    };

    // Add the new template to the list
    setBudgetTemplates([...budgetTemplates, customTemplate]);

    // Reset the new template form
    setNewTemplate({
      name: "",
      description: "",
      categories: [],
    });

    // Close the dialog
    setCustomTemplateDialogOpen(false);

    toast({
      title: "Custom Template Created",
      description: `${customTemplate.name} has been added to your templates.`,
    });
  };

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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Budget
          </Button>
        </div>
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
                <div className="flex justify-center space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setTemplateDialogOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Use Budget Template
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Budget
                  </Button>
                </div>
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
                              onClick={() => saveBudgetAsTemplate(budget)}
                              title="Save as Template"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBudget(budget);
                                setEditDialogOpen(true);
                              }}
                              title="Edit Budget"
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
                              title="Delete Budget"
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
              <TabsList className="mb-6">
                <TabsTrigger value="budgets">Budgets</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="expenses">
                  Expenses
                  {expenses.filter((e) => e.status === "PENDING").length >
                    0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      {expenses.filter((e) => e.status === "PENDING").length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="budgets" className="mt-0">
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
                                const percentage =
                                  calculateAllocationPercentage(
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
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
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
                                const percentage =
                                  calculateAllocationPercentage(
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
              </TabsContent>

              <TabsContent value="expenses" className="mt-0">
                {selectedCallId ? (
                  <PendingExpensesTab startupCallId={selectedCallId} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Image
                      src="/icons/startups.svg"
                      width={120}
                      height={120}
                      alt="Select Startup"
                      className="mb-6 opacity-50"
                    />
                    <h3 className="text-lg font-medium">
                      Select a Startup Call
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Please select a startup call from the dropdown above to
                      view and manage expenses
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Budget Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Budget Templates</DialogTitle>
            <DialogDescription>
              Choose a template to quickly create a standardized budget
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {budgetTemplates.map((template) => (
              <div key={template.id} onClick={() => applyTemplate(template)}>
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? "ring-2 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description || "No description available"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.categories.map((category) => (
                        <Badge
                          key={category.id}
                          variant="outline"
                          className="bg-muted"
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Add Custom Template Card */}
            <div onClick={() => setCustomTemplateDialogOpen(true)}>
              <Card className="cursor-pointer hover:bg-muted/50 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Create Custom Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                  <PlusCircle className="h-10 w-10 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => applyTemplate(selectedTemplate)}
              disabled={!selectedTemplate}
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Custom Template Dialog */}
      <Dialog
        open={customTemplateDialogOpen}
        onOpenChange={setCustomTemplateDialogOpen}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Custom Budget Template</DialogTitle>
            <DialogDescription>
              Define your own budget template for reuse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="E.g., Software Development Budget"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="Briefly describe what this template is for"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Categories</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTemplate({
                      ...newTemplate,
                      categories: [
                        ...newTemplate.categories,
                        { name: "", description: "", percentage: 0 },
                      ],
                    });
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add Category
                </Button>
              </div>

              {newTemplate.categories.length === 0 ? (
                <div className="text-center py-4 bg-muted/40 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No categories added. Click "Add Category" to create
                    categories.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newTemplate.categories.map((category, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-start"
                    >
                      <div className="col-span-5">
                        <Input
                          value={category.name}
                          onChange={(e) => {
                            const updated = [...newTemplate.categories];
                            updated[index].name = e.target.value;
                            setNewTemplate({
                              ...newTemplate,
                              categories: updated,
                            });
                          }}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          value={category.description}
                          onChange={(e) => {
                            const updated = [...newTemplate.categories];
                            updated[index].description = e.target.value;
                            setNewTemplate({
                              ...newTemplate,
                              categories: updated,
                            });
                          }}
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={category.percentage}
                          onChange={(e) => {
                            const updated = [...newTemplate.categories];
                            updated[index].percentage =
                              parseInt(e.target.value) || 0;
                            setNewTemplate({
                              ...newTemplate,
                              categories: updated,
                            });
                          }}
                          placeholder="%"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = [...newTemplate.categories];
                            updated.splice(index, 1);
                            setNewTemplate({
                              ...newTemplate,
                              categories: updated,
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Percentage Total */}
                  <div className="flex justify-between text-sm font-medium mt-2">
                    <span>Total Allocation:</span>
                    <span
                      className={
                        newTemplate.categories.reduce(
                          (sum, cat) => sum + cat.percentage,
                          0
                        ) === 100
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {newTemplate.categories.reduce(
                        (sum, cat) => sum + cat.percentage,
                        0
                      )}
                      %
                      {newTemplate.categories.reduce(
                        (sum, cat) => sum + cat.percentage,
                        0
                      ) !== 100 && " (Should be 100%)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createCustomTemplate}
              disabled={
                !newTemplate.name ||
                newTemplate.categories.length === 0 ||
                newTemplate.categories.reduce(
                  (sum, cat) => sum + cat.percentage,
                  0
                ) !== 100
              }
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              templateData={selectedTemplate}
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
          <div className="pt-4 pb-2">
            {selectedBudget && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You are about to delete budget "{selectedBudget.title}". If
                  this budget is being used by any approved applications, they
                  will lose their budget allocation.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
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
              {loading ? <LoadingSpinner /> : "Delete Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetAllocation;
