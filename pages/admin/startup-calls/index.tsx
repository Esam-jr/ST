import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
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
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Users,
  BarChart,
} from "lucide-react";
import { format } from "date-fns";

interface StartupCall {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  applicationCount?: number;
}

export default function StartupCallsAdmin() {
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
      setStartupCalls(response.data);
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Startup Calls</h1>
            <p className="text-muted-foreground">
              View and manage all startup calls
            </p>
          </div>
          <Button onClick={() => router.push("/admin/startup-calls/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Call
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Startup Calls</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              Total: {startupCalls.length} startup calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading startup calls...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Applications</TableHead>
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
                          {call.applicationCount || 0} applications
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/startup-calls/${call.id}`)
                              }
                            >
                              <FileText className="h-4 w-4 mr-1" /> Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/admin/startup-calls/${call.id}/applications`
                                )
                              }
                            >
                              <Users className="h-4 w-4 mr-1" /> Applications
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/admin/startup-calls/${call.id}/budgets`
                                )
                              }
                            >
                              <DollarSign className="h-4 w-4 mr-1" /> Budgets
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/admin/startup-calls",
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
