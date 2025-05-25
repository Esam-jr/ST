import { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2, Mail, Phone, Globe } from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';

interface Application {
  id: string;
  sponsorType: string;
  organizationName: string;
  legalName: string;
  website?: string;
  description: string;
  proposedAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  sponsorshipGoals: string;
  hasPreviousSponsorships: boolean;
  previousSponsorshipsDetails?: string;
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/sponsorship-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      setProcessingAction(applicationId);
      await axios.put(`/api/admin/sponsorship-applications/${applicationId}`, {
        status: newStatus,
      });

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      toast({
        title: 'Success',
        description: `Application ${newStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsorship Applications</CardTitle>
        <CardDescription>
          Review and manage sponsorship applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {application.organizationName || application.legalName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {application.sponsorType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{application.primaryContact.name}</span>
                        <span className="text-muted-foreground">
                          {application.primaryContact.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(application.proposedAmount, application.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          application.status === "APPROVED"
                            ? "default"
                            : application.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {application.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => handleStatusChange(application.id, "APPROVED")}
                              disabled={processingAction === application.id}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => handleStatusChange(application.id, "REJECTED")}
                              disabled={processingAction === application.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about the sponsorship application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Information
                    </h4>
                    <div className="mt-2 space-y-2">
                      <p>
                        <span className="font-medium">Legal Name:</span> {selectedApplication.legalName}
                      </p>
                      {selectedApplication.organizationName && (
                        <p>
                          <span className="font-medium">Organization Name:</span>{" "}
                          {selectedApplication.organizationName}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Type:</span> {selectedApplication.sponsorType}
                      </p>
                      {selectedApplication.website && (
                        <p className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a
                            href={selectedApplication.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {selectedApplication.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Primary Contact</h4>
                    <div className="mt-2 space-y-2">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedApplication.primaryContact.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedApplication.primaryContact.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Sponsorship Details</h4>
                    <div className="mt-2 space-y-2">
                      <p>
                        <span className="font-medium">Proposed Amount:</span>{" "}
                        {formatCurrency(selectedApplication.proposedAmount, selectedApplication.currency)}
                      </p>
                      <p>
                        <span className="font-medium">Goals:</span>
                        <br />
                        {selectedApplication.sponsorshipGoals}
                      </p>
                    </div>
                  </div>

                  {selectedApplication.hasPreviousSponsorships && (
                    <div>
                      <h4 className="font-medium">Previous Sponsorships</h4>
                      <p className="mt-2 whitespace-pre-line">
                        {selectedApplication.previousSponsorshipsDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium">Description</h4>
                <p className="mt-2 whitespace-pre-line">{selectedApplication.description}</p>
              </div>

              {selectedApplication.status === "PENDING" && (
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    onClick={() => {
                      handleStatusChange(selectedApplication.id, "REJECTED");
                      setShowDetailsDialog(false);
                    }}
                  >
                    Reject Application
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleStatusChange(selectedApplication.id, "APPROVED");
                      setShowDetailsDialog(false);
                    }}
                  >
                    Approve Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 