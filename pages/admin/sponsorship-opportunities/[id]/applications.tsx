import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import Head from "next/head";
import {
  ChevronLeft,
  Download,
  Filter,
  Search,
  X,
  Check,
  ExternalLink,
  SortAsc,
  SortDesc,
  Phone,
  Mail,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

// Types
interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  sponsorId: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  sponsorName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  website: string | null;
  sponsorshipType: string;
  otherType: string | null;
  sponsor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: string | null;
}

type SortField = "amount" | "createdAt" | "sponsorName" | "status";
type SortOrder = "asc" | "desc";

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [applications, setApplications] = useState<SponsorshipApplication[]>(
    []
  );
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedApplication, setSelectedApplication] =
    useState<SponsorshipApplication | null>(null);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
    useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Check authentication and fetch data
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      if (id) {
        fetchOpportunity();
        fetchApplications();
      }
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/admin/sponsorship-opportunities");
    }
  }, [status, session, id]);

  // Fetch the opportunity details
  const fetchOpportunity = async () => {
    try {
      const response = await axios.get(
        `/api/admin/sponsorship-opportunities/${id}`
      );
      setOpportunity(response.data);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity details",
        variant: "destructive",
      });
    }
  };

  // Fetch all applications for this opportunity
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/sponsorship-opportunities/${id}/applications`
      );
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const updateApplicationStatus = async () => {
    if (!selectedApplication || !newStatus) return;

    try {
      await axios.patch(
        `/api/admin/sponsorship-applications/${selectedApplication.id}`,
        {
          status: newStatus,
        }
      );

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, status: newStatus }
            : app
        )
      );

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
      });

      setIsUpdateStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  // Export applications to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Sponsor Name",
      "Contact Person",
      "Email",
      "Phone",
      "Website",
      "Type",
      "Amount",
      "Status",
      "Submitted",
      "Message",
    ];

    const rows = filteredApplications.map((app) => [
      app.id,
      app.sponsorName,
      app.contactPerson,
      app.email,
      app.phone || "N/A",
      app.website || "N/A",
      app.sponsorshipType + (app.otherType ? ` - ${app.otherType}` : ""),
      `${formatCurrency(app.amount, app.currency)}`,
      app.status,
      format(new Date(app.createdAt), "PPP"),
      app.message || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${opportunity?.title || "sponsorship"}-applications.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle sort toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get unique status values for filter
  const uniqueStatuses = Array.from(
    new Set(applications.map((app) => app.status))
  );

  // Get unique sponsorship types for filter
  const uniqueTypes = Array.from(
    new Set(applications.map((app) => app.sponsorshipType))
  );

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        searchTerm === "" ||
        app.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.message &&
          app.message.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "" || app.status === statusFilter;
      const matchesType =
        typeFilter === "" || app.sponsorshipType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "sponsorName":
          comparison = a.sponsorName.localeCompare(b.sponsorName);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "WITHDRAWN":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Head>
        <title>
          Applications - {opportunity?.title || "Sponsorship Opportunity"}
        </title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl bg-white shadow-sm rounded-lg my-6 p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() =>
                router.push(`/admin/sponsorship-opportunities/${id}`)
              }
              className="mb-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Opportunity
            </Button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">
                  Applications for{" "}
                  {opportunity?.title || "Sponsorship Opportunity"}
                </h1>
                <p className="text-gray-500 mt-1">
                  {filteredApplications.length} application
                  {filteredApplications.length !== 1 ? "s" : ""} received
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchApplications();
                    toast({
                      title: "Refreshed",
                      description: "Applications data has been refreshed",
                    });
                  }}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={filteredApplications.length === 0}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filter Applications</CardTitle>
              <CardDescription>
                Use the filters below to find specific applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or message..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="w-full md:w-1/4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {statusFilter || "Filter by Status"}
                        <Filter className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setStatusFilter("")}>
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {uniqueStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => setStatusFilter(status)}
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="w-full md:w-1/4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {typeFilter || "Filter by Type"}
                        <Filter className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setTypeFilter("")}>
                        All Types
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {uniqueTypes.map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => setTypeFilter(type)}
                        >
                          {type}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {(searchTerm || statusFilter || typeFilter) && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {searchTerm && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Search: {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear search</span>
                      </button>
                    </Badge>
                  )}
                  {statusFilter && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("")}
                        className="ml-1 rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear status filter</span>
                      </button>
                    </Badge>
                  )}
                  {typeFilter && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Type: {typeFilter}
                      <button
                        onClick={() => setTypeFilter("")}
                        className="ml-1 rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear type filter</span>
                      </button>
                    </Badge>
                  )}
                  {(searchTerm || statusFilter || typeFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
                        setTypeFilter("");
                      }}
                      className="text-sm ml-auto"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
              <div className="mt-4 text-gray-500">Loading applications...</div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="text-gray-500 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? "No applications match your filters."
                  : "No applications have been submitted for this opportunity yet."}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setTypeFilter("");
                }}
              >
                {searchTerm || statusFilter || typeFilter
                  ? "Clear Filters"
                  : "Refresh"}
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex justify-between items-center">
                  <span>Application Submissions</span>
                  <span className="text-sm font-normal text-gray-500">
                    {filteredApplications.length} result
                    {filteredApplications.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-[250px]">Sponsor</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px]">
                        Type
                      </TableHead>
                      <TableHead
                        className="w-[120px] cursor-pointer"
                        onClick={() => toggleSort("amount")}
                      >
                        <div className="flex items-center">
                          Amount
                          {sortField === "amount" &&
                            (sortOrder === "asc" ? (
                              <SortAsc className="ml-1 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="hidden md:table-cell cursor-pointer"
                        onClick={() => toggleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          {sortField === "status" &&
                            (sortOrder === "asc" ? (
                              <SortAsc className="ml-1 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="hidden md:table-cell cursor-pointer"
                        onClick={() => toggleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Submitted
                          {sortField === "createdAt" &&
                            (sortOrder === "asc" ? (
                              <SortAsc className="ml-1 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow
                        key={application.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {application.sponsorName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {application.contactPerson}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <a
                                href={`mailto:${application.email}`}
                                className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                {application.email}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            {application.sponsorshipType}
                            {application.otherType &&
                              ` - ${application.otherType}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(
                              application.amount,
                              application.currency
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {renderStatusBadge(application.status)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="whitespace-nowrap">
                            {format(
                              new Date(application.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Options</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setNewStatus(application.status);
                                  setIsUpdateStatusDialogOpen(true);
                                }}
                              >
                                Update Status
                              </DropdownMenuItem>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    View Details
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Application Details
                                    </DialogTitle>
                                    <DialogDescription>
                                      Submitted on{" "}
                                      {format(
                                        new Date(application.createdAt),
                                        "MMMM d, yyyy"
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-4 gap-4">
                                      <div className="font-medium text-sm">
                                        Status
                                      </div>
                                      <div className="col-span-3">
                                        {renderStatusBadge(application.status)}
                                      </div>

                                      <div className="font-medium text-sm">
                                        Sponsor
                                      </div>
                                      <div className="col-span-3 font-medium">
                                        {application.sponsorName}
                                      </div>

                                      <div className="font-medium text-sm">
                                        Contact
                                      </div>
                                      <div className="col-span-3">
                                        {application.contactPerson}
                                      </div>

                                      <div className="font-medium text-sm">
                                        Email
                                      </div>
                                      <div className="col-span-3">
                                        <a
                                          href={`mailto:${application.email}`}
                                          className="text-blue-600 hover:text-blue-800 flex items-center"
                                        >
                                          <Mail className="mr-1 h-3 w-3" />
                                          {application.email}
                                        </a>
                                      </div>

                                      {application.phone && (
                                        <>
                                          <div className="font-medium text-sm">
                                            Phone
                                          </div>
                                          <div className="col-span-3">
                                            <a
                                              href={`tel:${application.phone}`}
                                              className="text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                              <Phone className="mr-1 h-3 w-3" />
                                              {application.phone}
                                            </a>
                                          </div>
                                        </>
                                      )}

                                      {application.website && (
                                        <>
                                          <div className="font-medium text-sm">
                                            Website
                                          </div>
                                          <div className="col-span-3">
                                            <a
                                              href={application.website}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                              <Globe className="mr-1 h-3 w-3" />
                                              {application.website}
                                              <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                          </div>
                                        </>
                                      )}

                                      <div className="font-medium text-sm">
                                        Type
                                      </div>
                                      <div className="col-span-3">
                                        {application.sponsorshipType}
                                        {application.otherType &&
                                          ` - ${application.otherType}`}
                                      </div>

                                      <div className="font-medium text-sm">
                                        Amount
                                      </div>
                                      <div className="col-span-3">
                                        {formatCurrency(
                                          application.amount,
                                          application.currency
                                        )}
                                      </div>
                                    </div>

                                    {application.message && (
                                      <div className="pt-2">
                                        <div className="font-medium text-sm mb-1">
                                          Message
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                                          {application.message}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Update Status Dialog */}
          <Dialog
            open={isUpdateStatusDialogOpen}
            onOpenChange={setIsUpdateStatusDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Application Status</DialogTitle>
                <DialogDescription>
                  Change the status of the application from{" "}
                  {selectedApplication?.sponsorName}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  New Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={updateApplicationStatus}>
                  <Check className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
