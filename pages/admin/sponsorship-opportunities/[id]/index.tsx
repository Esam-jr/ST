import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  Check,
  X,
  MessageCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  ArrowRight,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

// Define types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
  _count?: {
    applications: number;
  };
  coverImage?: string;
  deadline?: string;
  industryFocus?: string;
  tags?: string[];
  eligibility?: string;
}

interface SponsorshipApplication {
  id: string;
  opportunityId: string;
  sponsorId: string;
  
  // Sponsor Information
  sponsorType: 'COMPANY' | 'INDIVIDUAL' | 'NGO' | 'FOUNDATION' | 'OTHER';
  organizationName?: string;
  legalName: string;
  website?: string;
  description: string;
  annualBudget?: string;
  size?: string;
  foundedYear?: number;
  headquarters?: string;
  taxStatus?: string;
  
  // Contact Information
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  alternateContact?: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  
  // Sponsorship Details
  proposedAmount: number;
  currency: string;
  sponsorshipGoals: string;
  hasPreviousSponsorships: boolean;
  previousSponsorshipsDetails?: string;
  preferredPaymentSchedule?: string;
  additionalRequests?: string;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  
  // Status
  status: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sponsor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    website?: string;
  };
}

interface Props {
  opportunity: SponsorshipOpportunity;
  applications: SponsorshipApplication[];
}

export default function OpportunityDetails({ opportunity, applications: initialApplications }: Props) {
  const [applications, setApplications] = useState<SponsorshipApplication[]>(initialApplications);
  const [selectedApplication, setSelectedApplication] = useState<SponsorshipApplication | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setProcessingAction(applicationId);
    try {
      const response = await fetch(`/api/sponsorship-applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
    }

      const updatedApplication = await response.json();

      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Success",
        description: `Application status updated to ${newStatus.toLowerCase()} successfully`,
      });

      // Send notification to the sponsor
      await prisma.notification.create({
        data: {
          userId: updatedApplication.sponsorId,
          title: "Sponsorship Application Status Update",
          message: `Your sponsorship application for "${opportunity.title}" has been ${newStatus.toLowerCase()}.`,
          type: "SPONSORSHIP_APPLICATION",
          link: `/sponsorship-applications/${applicationId}`,
        },
      });

    } catch (error: unknown) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

        return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {opportunity.status}
          </Badge>
              </div>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Review and manage sponsorship applications
              </CardDescription>
            </CardHeader>
            <CardContent>
      <div className="rounded-md border">
        <Table>
                  <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.organizationName || application.legalName}
                    </div>
                    <div className="text-sm text-gray-500">
                                {application.primaryContact.email}
                              </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(
                            application.proposedAmount,
                    application.currency
                  )}
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
                          {format(new Date(application.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-8"
                              onClick={() => handleStatusChange(application.id, "APPROVED")}
                              disabled={processingAction === application.id}
                        >
                              Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 h-8"
                              onClick={() => handleStatusChange(application.id, "REJECTED")}
                              disabled={processingAction === application.id}
                        >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              View
                        </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApplication ? (
                <div className="space-y-4">
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                      <h4 className="text-sm font-medium">Organization</h4>
                      <p>
                        {selectedApplication.organizationName || selectedApplication.legalName}
                        <br />
                        {selectedApplication.website && (
                          <a
                            href={selectedApplication.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {selectedApplication.website}
                          </a>
                        )}
                  </p>
                </div>
                <div>
                      <h4 className="text-sm font-medium">Contact Information</h4>
                    <p>
                        {selectedApplication.primaryContact.name}
                        <br />
                        {selectedApplication.primaryContact.email}
                        <br />
                        {selectedApplication.primaryContact.phone}
                      </p>
                </div>
              </div>

              <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="mt-1 whitespace-pre-line">
                      {selectedApplication.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Sponsorship Goals</h4>
                    <p className="mt-1 whitespace-pre-line">
                      {selectedApplication.sponsorshipGoals}
                    </p>
              </div>

                  {selectedApplication.hasPreviousSponsorships && selectedApplication.previousSponsorshipsDetails && (
                <div>
                      <h4 className="text-sm font-medium">Previous Sponsorships</h4>
                  <p className="mt-1 whitespace-pre-line">
                        {selectedApplication.previousSponsorshipsDetails}
                  </p>
                </div>
              )}
            </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select an application to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

