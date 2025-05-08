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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  FileText,
  DollarSign,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface StartupCall {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  budgetsCount?: number;
}

export default function BudgetManagement() {
  const router = useRouter();
  const [startupCalls, setStartupCalls] = useState<StartupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStartupCalls();
  }, []);

  const fetchStartupCalls = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/startup-calls");

      // Add mock budget counts for demonstration purposes
      // In a real application, you would fetch this data from the API
      const callsWithBudgetCount = response.data.map((call: StartupCall) => ({
        ...call,
        budgetsCount: Math.floor(Math.random() * 5) + 1, // Random count between 1-5
      }));

      setStartupCalls(callsWithBudgetCount);
    } catch (error) {
      console.error("Error fetching startup calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = startupCalls.filter((call) =>
    call.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "REVIEWING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">
            Manage budgets for all startup calls
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Startup Calls with Budgets</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search startup calls..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Select a startup call to manage its budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading startup calls...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup Call</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Budgets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No startup calls found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        {call.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.startDate && call.endDate
                          ? `${format(
                              new Date(call.startDate),
                              "MMM dd, yyyy"
                            )} - ${format(
                              new Date(call.endDate),
                              "MMM dd, yyyy"
                            )}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {call.budgetsCount} budget
                        {call.budgetsCount !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/startup-calls/${call.id}/budgets`
                            )
                          }
                        >
                          <DollarSign className="h-4 w-4 mr-1" /> Manage Budgets
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Reports</CardTitle>
          <CardDescription>
            Generate and download budget reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => router.push("/admin?section=financials")}
            >
              <Calculator className="h-8 w-8 mb-2" />
              Overview Reports
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => {
                // In a real app, this would generate a report
                alert(
                  "This would generate a detailed budget report. The functionality is in progress."
                );
              }}
            >
              <FileText className="h-8 w-8 mb-2" />
              Detailed Reports
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => {
                // In a real app, this would export to Excel
                alert(
                  "This would export budget data to Excel. The functionality is in progress."
                );
              }}
            >
              <DollarSign className="h-8 w-8 mb-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination:
          "/auth/signin?callbackUrl=/admin?section=budget-management",
        permanent: false,
      },
    };
  }

  const user = session.user as { role?: string };

  if (user.role !== "ADMIN") {
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
