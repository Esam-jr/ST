import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, RefreshCw, FileText } from "lucide-react";
import BudgetReportDialog from "@/components/admin/BudgetReportDialog";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { ExpenseList } from "@/components/budget/ExpenseList";
import { FilterBar } from "@/components/budget/FilterBar";
import { Budget } from "@/contexts/BudgetContext";

// Types
interface StartupCall {
  id: string;
  title: string;
}

export default function BudgetManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const { id: startupCallId } = router.query;

  const [startupCall, setStartupCall] = useState<StartupCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("budgets");

  // Dialog states
  const [newBudgetDialogOpen, setNewBudgetDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Fetch startup call details
  useEffect(() => {
    if (startupCallId && typeof startupCallId === "string") {
      const fetchStartupCall = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `/api/startup-calls/${startupCallId}`
          );
          setStartupCall(response.data);
        } catch (error) {
          console.error("Error fetching startup call:", error);
          toast({
            title: "Error",
            description: "Failed to fetch startup call details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchStartupCall();
    }
  }, [startupCallId, toast]);

  const handleBudgetSubmit = (budget: Budget) => {
    setNewBudgetDialogOpen(false);
    toast({
      title: "Budget Created",
      description: `Budget "${budget.title}" has been successfully created.`,
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (!startupCall) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <p className="text-xl font-semibold">Startup Call Not Found</p>
            <p className="mt-2 text-muted-foreground">
              The startup call you're looking for doesn't exist or has been
              removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/admin/startup-calls/budgets")}
            >
              Back to Budget Management
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setNewBudgetDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Budget
            </Button>
            <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        <TabsContent value="budgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Budgets</CardTitle>
              <CardDescription>
                View and manage budgets for {startupCall.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilterBar
                showBudgetFilter={true}
                showCategoryFilter={false}
                showStatusFilter={true}
              />

              <div className="mt-6">
                <ExpenseList
                  startupCallId={startupCallId as string}
                  showAddButton={false}
                  showBudgetFilter={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Expenses</CardTitle>
              <CardDescription>
                Manage expenses across all budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilterBar
                showBudgetFilter={true}
                showCategoryFilter={true}
                showStatusFilter={true}
              />

              <div className="mt-6">
                <ExpenseList
                  startupCallId={startupCallId as string}
                  showAddButton={true}
                  showBudgetFilter={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <BudgetProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">
              {startupCall
                ? `Managing budgets for ${startupCall.title}`
                : "Loading..."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/startup-calls/budgets")}
          >
            Back to All Calls
          </Button>
        </div>

        {/* Main Content */}
        {renderContent()}

        {/* Create Budget Dialog */}
        <Dialog
          open={newBudgetDialogOpen}
          onOpenChange={setNewBudgetDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <BudgetForm
              startupCallId={startupCallId as string}
              onSubmit={handleBudgetSubmit}
              onCancel={() => setNewBudgetDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Budget Report Dialog */}
        {startupCall && (
          <BudgetReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            startupCallId={startupCallId as string}
            startupCallTitle={startupCall.title}
          />
        )}
      </div>
    </BudgetProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=" + context.resolvedUrl,
        permanent: false,
      },
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
