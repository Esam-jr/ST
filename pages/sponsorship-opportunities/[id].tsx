import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Building,
  Star,
  LogIn,
  Info,
  ArrowRight,
  CalendarDays,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import ApplySponsorshipForm from "@/components/sponsor/ApplySponsorshipForm";
import Head from "next/head";

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
  deadline?: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
    description: string;
    industry?: string;
  };
}

// Add type for session user
interface SessionUser {
  id: string;
  role: string;
  email: string;
}

export default function OpportunityDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching opportunity with ID: ${id}`);
      const response = await axios.get(
        `/api/public/sponsorship-opportunities/${id}`
      );
      console.log("Opportunity details:", response.data);
      setOpportunity(response.data);
    } catch (err: any) {
      console.error("Error fetching opportunity:", err);
      setError("Failed to load opportunity details");
      toast({
        title: "Error",
        description: "Could not load opportunity details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    // Only sponsors can apply
    if (!session || session.user?.role !== "SPONSOR") {
      router.push(`/login?callbackUrl=/sponsorship-opportunities/${id}`);
      return;
    }

    try {
      setApplyLoading(true);

      // In a real application, this would have a form to collect the amount
      // For this demo, we'll use the minimum amount
      const amount = opportunity?.minAmount || 0;
      const currency = opportunity?.currency || "USD";

      // Submit application
      await axios.post("/api/sponsors/me/applications", {
        opportunityId: id,
        amount,
        currency,
      });

      toast({
        title: "Application Submitted",
        description:
          "Your sponsorship application has been submitted successfully.",
        variant: "default",
      });

      // Redirect to applications page
      router.push("/sponsor-dashboard?tab=applications");
    } catch (err: any) {
      console.error("Error submitting application:", err);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApplyLoading(false);
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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if opportunity has a deadline and if it's in the past
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;

    const deadlineDate = new Date(deadline);
    const now = new Date();

    return deadlineDate < now;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading opportunity details...</span>
        </div>
      </Layout>
    );
  }

  if (error || !opportunity) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Opportunity</h2>
          <p className="text-muted-foreground mb-4">
            {error || "Opportunity not found"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{opportunity.title} | Sponsorship Opportunity</title>
        <meta
          name="description"
          content={opportunity.description.substring(0, 160)}
        />
      </Head>

      <Layout>
        <div className="container mx-auto py-6 px-4 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Opportunities
              </Button>

              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{opportunity.title}</h1>
                {isDeadlinePassed(opportunity.deadline) ? (
                  <Badge variant="destructive" className="ml-2">
                    Deadline Passed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">
                    <Clock className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>

              {opportunity.startupCall && (
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  {opportunity.startupCall.title}
                  {opportunity.startupCall.industry && (
                    <Badge variant="secondary" className="ml-2">
                      {opportunity.startupCall.industry}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto">
              <Button
                size="lg"
                disabled={
                  applyLoading ||
                  isDeadlinePassed(opportunity.deadline) ||
                  (status === "authenticated" &&
                    session?.user?.role !== "SPONSOR")
                }
                onClick={handleApply}
                className="w-full sm:w-auto"
              >
                {applyLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Apply for Sponsorship
                  </>
                )}
              </Button>

              {status === "authenticated" &&
                session?.user?.role !== "SPONSOR" && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Only sponsors can apply for opportunities
                  </p>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {opportunity.description}
                  </p>

                  {opportunity.startupCall?.description && (
                    <>
                      <Separator className="my-6" />
                      <h3 className="text-lg font-semibold mb-3">
                        About the Startup
                      </h3>
                      <p className="whitespace-pre-line">
                        {opportunity.startupCall.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits for Sponsors</CardTitle>
                  <CardDescription>
                    What you'll receive when sponsoring this opportunity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {opportunity.benefits && opportunity.benefits.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {opportunity.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No specific benefits listed for this opportunity.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sponsorship Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Sponsorship Range
                    </h3>
                    <div className="flex items-center text-lg font-semibold">
                      <DollarSign className="h-5 w-5 text-primary mr-1" />
                      {formatCurrency(
                        opportunity.minAmount,
                        opportunity.currency
                      )}
                      {opportunity.minAmount !== opportunity.maxAmount && (
                        <>
                          {" "}
                          -{" "}
                          {formatCurrency(
                            opportunity.maxAmount,
                            opportunity.currency
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Application Deadline
                    </h3>
                    <div className="flex items-center">
                      <CalendarDays className="h-5 w-5 text-primary mr-2" />
                      <span
                        className={
                          isDeadlinePassed(opportunity.deadline)
                            ? "text-destructive"
                            : ""
                        }
                      >
                        {formatDate(opportunity.deadline)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      How to Apply
                    </h3>
                    <p className="text-sm">
                      Click the "Apply for Sponsorship" button above to submit
                      your application for this opportunity.
                      {!session &&
                        " You'll need to sign in or create an account first."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Opportunity ID: {opportunity.id.substring(0, 8)}
                  </span>
                  {session?.user?.role === "ADMIN" && (
                    <Link href={`/admin/opportunities/${opportunity.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>

              {!session ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In to Apply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      You need to be signed in as a sponsor to apply for this
                      opportunity.
                    </p>
                    <Button className="w-full" asChild>
                      <Link
                        href={`/login?callbackUrl=/sponsorship-opportunities/${id}`}
                      >
                        Sign In or Register
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
