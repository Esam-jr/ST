import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, FileBarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/contexts/BudgetContext";
import BudgetOverviewPanel from "./BudgetOverviewPanel";
import ExpenseManagementPanel from "./ExpenseManagementPanel";
import PendingApprovalsPanel from "./PendingApprovalsPanel";

// Type definitions
type StartupCall = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
};

interface BudgetManagementPanelProps {
  startupCallId?: string;
}

export default function BudgetManagementPanel({
  startupCallId: defaultStartupCallId,
}: BudgetManagementPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    fetchBudgets,
    fetchExpenses,
    isLoading: budgetsLoading,
  } = useBudget();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | undefined>(
    defaultStartupCallId
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all startup calls
  useEffect(() => {
    const fetchStartupCalls = async () => {
      try {
        const { data } = await axios.get("/api/startup-calls");
        setStartupCalls(data);

        // If no default ID is provided, select the first call
        if (!defaultStartupCallId && data.length > 0) {
          setSelectedCallId(data[0].id);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching startup calls:", error);
        toast({
          title: "Error",
          description: "Failed to fetch startup calls",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchStartupCalls();
  }, [defaultStartupCallId, toast]);

  // Handle startup call selection change
  const handleStartupCallChange = (callId: string) => {
    setSelectedCallId(callId);

    // If we're on a specific startup call page, redirect to the generic budget management page
    if (defaultStartupCallId) {
      router.push(`/admin/startup-calls/${callId}/budgets`);
    }
  };

  // Load data when selected call changes
  useEffect(() => {
    if (selectedCallId) {
      fetchBudgets(selectedCallId);
      fetchExpenses(selectedCallId);
    }
  }, [selectedCallId, fetchBudgets, fetchExpenses]);

  // Refresh data
  const handleRefresh = async () => {
    if (!selectedCallId) return;

    try {
      await Promise.all([
        fetchBudgets(selectedCallId),
        fetchExpenses(selectedCallId),
      ]);

      toast({
        title: "Refreshed",
        description: "Budget data has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  // Navigate to reports
  const navigateToReports = () => {
    if (selectedCallId) {
      router.push(`/admin/startup-calls/${selectedCallId}/budget-reports`);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedCallId}
            onValueChange={handleStartupCallChange}
            disabled={isLoading || !!defaultStartupCallId}
          >
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Select a startup call" />
            </SelectTrigger>
            <SelectContent>
              {startupCalls.map((call) => (
                <SelectItem key={call.id} value={call.id}>
                  {call.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || !selectedCallId}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={navigateToReports}
            disabled={isLoading || !selectedCallId}
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      ) : selectedCallId ? (
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Budget Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expense Management</TabsTrigger>
            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <BudgetOverviewPanel startupCallId={selectedCallId} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpenseManagementPanel startupCallId={selectedCallId} />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <PendingApprovalsPanel startupCallId={selectedCallId} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                No startup call selected
              </h3>
              <p className="text-muted-foreground mt-1">
                Please select a startup call to manage budgets
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
