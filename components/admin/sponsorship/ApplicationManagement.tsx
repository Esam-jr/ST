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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { Search, Building2, Mail, Phone, Globe, AlertCircle, Save } from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { sponsorshipTemplates, NotificationTemplate } from '@/lib/config/notification-templates';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [customTemplate, setCustomTemplate] = useState<NotificationTemplate>({
    id: 'custom',
    name: '',
    type: 'SPONSORSHIP_APPLICATION',
    subject: '',
    emailContent: '',
    notificationContent: '',
  });
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

  const handleStatusAction = async (applicationId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionType(newStatus);
    setProcessingAction(applicationId);
    setSelectedApplications([applicationId]);
    setShowConfirmDialog(true);
  };

  const handleMassAction = (status: 'APPROVED' | 'REJECTED') => {
    if (selectedApplications.length === 0) {
      toast({
        title: 'No Applications Selected',
        description: 'Please select at least one application to process.',
        variant: 'destructive',
      });
      return;
    }
    setActionType(status);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!actionType || selectedApplications.length === 0) return;

    try {
      let template: NotificationTemplate | null = null;

      if (selectedTemplate === 'custom') {
        template = customTemplate;
      } else if (selectedTemplate !== 'default') {
        template = sponsorshipTemplates.find(t => t.id === selectedTemplate) || null;
      }

      const response = await axios.post('/api/admin/sponsorship-applications/send-notification', {
        applicationIds: selectedApplications,
        notificationType: actionType,
        customTemplate: template,
      });

      if (response.data.success > 0) {
        setApplications(applications.map(app =>
          selectedApplications.includes(app.id) 
            ? { ...app, status: actionType === 'APPROVED' ? 'PRE_APPROVED' : 'REJECTED' }
            : app
        ));

        toast({
          title: 'Success',
          description: actionType === 'APPROVED' 
            ? `${response.data.success} application(s) pre-approved and notifications sent.`
            : `${response.data.success} application(s) rejected and notifications sent.`,
        });
      } else {
        throw new Error('Failed to process applications');
      }
    } catch (error) {
      console.error('Error processing applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to process applications',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
      setActionType(null);
      setShowConfirmDialog(false);
      setShowDetailsDialog(false);
      setSelectedApplications([]);
      setSelectedTemplate('default');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedApplications(
      checked 
        ? filteredApplications
            .filter(app => app.status === 'PENDING')
            .map(app => app.id)
        : []
    );
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
              <SelectItem value="PRE_APPROVED">Pre-Approved</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mass Action Buttons */}
        {selectedApplications.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedApplications.length} application(s) selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => handleMassAction('APPROVED')}
            >
              Approve Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              onClick={() => handleMassAction('REJECTED')}
            >
              Reject Selected
            </Button>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                  />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      {application.status === 'PENDING' && (
                        <Checkbox
                          checked={selectedApplications.includes(application.id)}
                          onCheckedChange={(checked: boolean) => {
                            setSelectedApplications(
                              checked
                                ? [...selectedApplications, application.id]
                                : selectedApplications.filter(id => id !== application.id)
                            );
                          }}
                        />
                      )}
                    </TableCell>
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
                            : application.status === "PRE_APPROVED"
                            ? "outline"
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
                              onClick={() => handleStatusAction(application.id, "APPROVED")}
                              disabled={processingAction === application.id}
                            >
                              Pre-Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => handleStatusAction(application.id, "REJECTED")}
                              disabled={processingAction === application.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {application.status === "PRE_APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            onClick={() => {
                              const newStatus = "APPROVED";
                              setApplications(applications.map(app =>
                                app.id === application.id ? { ...app, status: newStatus } : app
                              ));
                              toast({
                                title: 'Success',
                                description: 'Application has been fully approved.',
                              });
                            }}
                          >
                            Finalize Approval
                          </Button>
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
                <DialogFooter className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    onClick={() => handleStatusAction(selectedApplication.id, "REJECTED")}
                  >
                    Reject Application
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusAction(selectedApplication.id, "APPROVED")}
                  >
                    Approve Application
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'APPROVED' ? 'Approve Applications' : 'Reject Applications'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {actionType?.toLowerCase()} {selectedApplications.length} application(s) and send notifications to the sponsors.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Template</SelectItem>
                <SelectItem value="custom">Create Custom Template</SelectItem>
                {sponsorshipTemplates
                  .filter(template => 
                    actionType === 'APPROVED' 
                      ? template.id.startsWith('approval-')
                      : template.id.startsWith('rejection-')
                  )
                  .map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            {selectedTemplate === 'custom' && (
              <div className="space-y-4 mt-4">
                <div>
                  <Input
                    placeholder="Template Name"
                    value={customTemplate.name}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Email Subject"
                    value={customTemplate.subject}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Email Content (HTML supported)"
                    value={customTemplate.emailContent}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, emailContent: e.target.value }))}
                    rows={6}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="In-app Notification Content"
                    value={customTemplate.notificationContent}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, notificationContent: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Available variables: {'{sponsorName}'}, {'{opportunityTitle}'}, {'{applicationUrl}'}
                </div>
              </div>
            )}

            {selectedTemplate !== 'default' && selectedTemplate !== 'custom' && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Preview</h4>
                {(() => {
                  const template = sponsorshipTemplates.find(t => t.id === selectedTemplate);
                  return template ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Subject:</strong> {template.subject}</p>
                      <p><strong>Notification:</strong> {template.notificationContent}</p>
                      <details>
                        <summary className="cursor-pointer text-primary">View Email Content</summary>
                        <div className="mt-2 p-2 bg-background rounded border">
                          <div dangerouslySetInnerHTML={{ __html: template.emailContent }} />
                        </div>
                      </details>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setProcessingAction(null);
              setActionType(null);
              setSelectedApplications([]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} & Send Notifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 