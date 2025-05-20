import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCcw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BudgetOverviewPanel from "./BudgetOverviewPanel";
import ExpenseManagementPanel from "./ExpenseManagementPanel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type StartupCall = {
  id: string;
  name: string;
  startupId: string;
  startup: {
    name: string;
  };
};

interface BudgetManagementPanelProps {
  initialStartupCallId?: string;
}

export default function BudgetManagementPanel({
  initialStartupCallId,
}: BudgetManagementPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    initialStartupCallId || null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch startup calls on component mount
  useEffect(() => {
    fetchStartupCalls();
  }, []);

  // Fetch all startup calls from the API
  const fetchStartupCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/startup-calls");
      if (!response.ok) throw new Error("Failed to fetch startup calls");

      const data = await response.json();
      setStartupCalls(data);

      // Set first startup call as selected if none is selected
      if (!selectedCallId && data.length > 0) {
        setSelectedCallId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching startup calls:", error);
      toast({
        title: "Error",
        description: "Failed to load startup calls. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle startup call selection change
  const handleStartupCallChange = (callId: string) => {
    setSelectedCallId(callId);

    // Update URL query parameter without full page reload
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, id: callId },
      },
      undefined,
      { shallow: true }
    );
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStartupCalls();
    setRefreshing(false);
  };

  // Navigate to reports page
  const navigateToReports = () => {
    if (selectedCallId) {
      router.push(`/admin/startup-calls/${selectedCallId}/reports`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl">Budget Management</CardTitle>
            <CardDescription>
              Manage budgets and view expense history for startup calls
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select
              value={selectedCallId || ""}
              onValueChange={handleStartupCallChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select a startup call" />
              </SelectTrigger>
              <SelectContent>
                {startupCalls.map((call) => (
                  <SelectItem key={call.id} value={call.id}>
                    {call.startup.name} - {call.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={navigateToReports}
                disabled={!selectedCallId}
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full py-12 flex justify-center">
            <LoadingSpinner size={36} />
          </div>
        ) : !selectedCallId ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Please select a startup call to manage its budget
            </p>
          </div>
        ) : (
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Budget Overview</TabsTrigger>
              <TabsTrigger value="expenses">Expense History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <BudgetOverviewPanel startupCallId={selectedCallId} />
            </TabsContent>
            <TabsContent value="expenses" className="mt-4">
              <ExpenseManagementPanel startupCallId={selectedCallId} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
