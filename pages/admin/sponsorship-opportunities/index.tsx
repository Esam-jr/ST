import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  FileDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function SponsorshipOpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data: opportunities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "sponsorship-opportunities"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sponsorship-opportunities");
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      return response.json();
    },
  });

  const filteredOpportunities = opportunities?.filter((opportunity: any) => {
    const matchesSearch =
      opportunity.title.toLowerCase().includes(search.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Function to export opportunities to CSV
  const exportToCSV = () => {
    if (!filteredOpportunities || filteredOpportunities.length === 0) return;

    const headers = [
      "Title",
      "Status",
      "Min Amount",
      "Max Amount",
      "Currency",
      "Deadline",
      "Applications",
    ];

    const rows = filteredOpportunities.map((opp: any) => [
      opp.title,
      opp.status,
      opp.minAmount,
      opp.maxAmount,
      opp.currency,
      opp.deadline
        ? new Date(opp.deadline).toLocaleDateString()
        : "No deadline",
      opp._count?.applications || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sponsorship-opportunities.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />;
      case "CLOSED":
        return <XCircle className="h-4 w-4 text-red-500 mr-1.5" />;
      case "DRAFT":
        return <Clock className="h-4 w-4 text-amber-500 mr-1.5" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Sponsorship Opportunities | Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl bg-white shadow-sm rounded-lg my-6 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Sponsorship Opportunities
                </h1>
                <p className="text-gray-500 mt-1">
                  Manage sponsorship opportunities for startups and
                  organizations
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={
                    !filteredOpportunities || filteredOpportunities.length === 0
                  }
                  className="flex items-center"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Link href="/admin/sponsorship-opportunities/create">
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Opportunity
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
                <CardDescription>
                  Filter opportunities by title, description, or status
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search opportunities..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="rounded-md border bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Loading opportunities...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredOpportunities?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          No opportunities found
                        </div>
                        <div className="mt-2">
                          <Link href="/admin/sponsorship-opportunities/create">
                            <Button variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Create New Opportunity
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOpportunities?.map((opportunity: any) => (
                      <TableRow
                        key={opportunity.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/sponsorship-opportunities/${opportunity.id}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {opportunity.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {opportunity.minAmount && opportunity.maxAmount ? (
                            `${formatCurrency(
                              opportunity.minAmount
                            )} - ${formatCurrency(opportunity.maxAmount)}`
                          ) : opportunity.amount ? (
                            formatCurrency(opportunity.amount)
                          ) : (
                            <span className="text-gray-500">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {opportunity.deadline ? (
                            <span className="text-sm text-gray-700">
                              {formatDate(opportunity.deadline)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              No deadline
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              opportunity.status === "OPEN"
                                ? "default"
                                : opportunity.status === "CLOSED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="flex w-fit items-center"
                          >
                            {getStatusIcon(opportunity.status)}
                            {opportunity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/sponsorship-opportunities/${opportunity.id}/applications`}
                            className="text-blue-600 hover:underline flex items-center text-sm font-medium"
                          >
                            {opportunity._count?.applications || 0} applications
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link
                                href={`/admin/sponsorship-opportunities/${opportunity.id}`}
                              >
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <Link
                                href={`/admin/sponsorship-opportunities/${opportunity.id}/edit`}
                              >
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                              </Link>
                              <Link
                                href={`/admin/sponsorship-opportunities/${opportunity.id}/applications`}
                              >
                                <DropdownMenuItem>
                                  View Applications
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={
                                  opportunity.status === "DRAFT"
                                    ? "text-primary"
                                    : "text-gray-500"
                                }
                                disabled={opportunity.status !== "DRAFT"}
                              >
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={
                                  opportunity.status === "OPEN"
                                    ? "text-destructive"
                                    : "text-gray-500"
                                }
                                disabled={opportunity.status !== "OPEN"}
                              >
                                Close
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredOpportunities && filteredOpportunities.length > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
                <div>
                  Showing {filteredOpportunities.length} of{" "}
                  {opportunities.length} opportunities
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
