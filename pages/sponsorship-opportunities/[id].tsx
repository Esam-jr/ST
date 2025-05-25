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
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import ApplySponsorshipForm from "@/components/sponsor/ApplySponsorshipForm";

// Define types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  slug: string;
  description: string;
  benefits: string[];
  industryFocus?: string;
  tags: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  eligibility?: string;
  createdAt: string;
  deadline?: string;
  coverImage?: string;
  viewsCount: number;
  shareCount: number;
  tiers?: Record<string, Record<string, string | number>>;
  visibility: string;
  startupCallId: string | null;
  startupCall?: {
    title: string;
  };
}

// Add type for session user
interface SessionUser {
  id: string;
  role: string;
  email: string;
}

export default function PublicSponsorshipOpportunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<SponsorshipOpportunity | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOpportunityData();
    }
  }, [id]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);

      // Fetch opportunity details from the public API
      const opportunityResponse = await axios.get(
        `/api/public/sponsorship-opportunities/${id}`
      );
      setOpportunity(opportunityResponse.data);
    } catch (error) {
      console.error("Error fetching opportunity data:", error);

      toast({
        title: "Error",
        description:
          "Could not load the sponsorship opportunity. Please try again later.",
        variant: "destructive",
      });

      // Navigate back to the opportunities list if we can't load this one
      router.push("/sponsorship-opportunities");
    } finally {
      setLoading(false);
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
      <Layout title="Sponsorship Opportunity Details">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsorship-opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!opportunity) {
    return (
      <Layout title="Opportunity Not Found">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center mb-6">
            <Link href="/sponsorship-opportunities" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Opportunity Not Found</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">
                The sponsorship opportunity you are looking for could not be
                found.
              </p>
              <Link href="/sponsorship-opportunities">
                <Button>Return to All Opportunities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${opportunity.title} | Sponsorship Opportunity`}>
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div className="flex items-center">
            <Link href="/sponsorship-opportunities" className="mr-4">
              <Button variant="ghost" size="sm" className="hover:bg-primary/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {opportunity.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {opportunity.deadline && (
                  <Badge
                    className={
                      isDeadlinePassed(opportunity.deadline)
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-green-100 text-green-800 border-green-200"
                    }
                  >
                    {isDeadlinePassed(opportunity.deadline)
                      ? "Deadline Passed"
                      : "Open for Applications"}
                  </Badge>
                )}
                {opportunity.visibility === "PRIVATE" && (
                  <Badge variant="outline">Private</Badge>
                )}
                {opportunity.tags && opportunity.tags.length > 0 && (
                  opportunity.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
          <div>
            {!session && !isDeadlinePassed(opportunity.deadline) && (
              <Link
                href={`/auth/signin?callbackUrl=/sponsor/opportunities/${opportunity.id}/apply`}
              >
                <Button size="lg" className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                  Sign in to Apply
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {opportunity.coverImage && (
              <Card className="overflow-hidden">
                <img
                  src={opportunity.coverImage}
                  alt={opportunity.title}
                  className="w-full h-[300px] object-cover"
                />
              </Card>
            )}

        <Card>
          <CardHeader>
                <CardTitle className="text-2xl">About the Opportunity</CardTitle>
            {opportunity.startupCall && (
                  <CardDescription className="flex items-center text-base">
                    <Building className="h-5 w-5 mr-2" />
                Associated with {opportunity.startupCall.title}
              </CardDescription>
            )}
          </CardHeader>
              <CardContent className="space-y-6">
            <div>
                  <h3 className="text-lg font-medium mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {opportunity.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Funding Range</h3>
                    <div className="flex items-center text-gray-700 bg-primary/5 p-3 rounded-lg">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">
                        {formatCurrency(opportunity.minAmount, opportunity.currency)} -
                        {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                  </span>
                </div>
              </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Application Deadline</h3>
                    <div className="flex items-center text-gray-700 bg-primary/5 p-3 rounded-lg">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">
                        {formatDate(opportunity.deadline)}
                      </span>
                </div>
              </div>
            </div>

                {opportunity.benefits && opportunity.benefits.length > 0 && (
                  <>
            <Separator />
            <div>
                      <h3 className="text-lg font-medium mb-3">Sponsor Benefits</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {opportunity.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                            <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                    </div>
                  </>
                )}

                {opportunity.eligibility && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-3">Eligibility Criteria</h3>
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-line">
                          {opportunity.eligibility}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {opportunity.tiers && (
              <Card>
                <CardHeader>
                  <CardTitle>Sponsorship Tiers</CardTitle>
                  <CardDescription>Available sponsorship packages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(opportunity.tiers).map(([tier, details]: [string, Record<string, string | number>]) => (
                      <div key={tier} className="bg-primary/5 p-4 rounded-lg">
                        <h4 className="font-medium text-lg mb-2">{tier}</h4>
                        <ul className="space-y-2">
                          {Object.entries(details).map(([key, value]) => (
                            <li key={key} className="text-sm text-gray-700">
                              <span className="font-medium">{key}:</span> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
            </div>
          </CardContent>
              </Card>
            )}
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{opportunity.viewsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shares</span>
                    <span className="font-medium">{opportunity.shareCount}</span>
                  </div>
                  {opportunity.industryFocus && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Industry</span>
                      <Badge variant="outline">{opportunity.industryFocus}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="text-sm text-gray-500">
                      {new Date(opportunity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {sessionStatus === "authenticated" && !isDeadlinePassed(opportunity.deadline) && (
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Ready to Apply?
                  </CardTitle>
                  <CardDescription>
                    {session.user?.role === "SPONSOR"
                      ? "Submit your application to sponsor this opportunity."
                      : "Only sponsors can apply for this opportunity."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                  {session.user?.role === "SPONSOR" ? (
                    <ApplySponsorshipForm
                      opportunityId={opportunity.id}
                      minAmount={opportunity.minAmount}
                      maxAmount={opportunity.maxAmount}
                      currency={opportunity.currency}
                      onSuccess={() => {
                        toast({
                          title: "Application Submitted",
                            description: "Your application has been submitted successfully.",
                          variant: "default",
                        });
                          fetchOpportunityData();
                      }}
                    />
                  ) : (
                    <Button
                      variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      disabled
                    >
                      <Info className="h-4 w-4" />
                      Only Sponsors Can Apply
                    </Button>
                  )}
                  <Link href="/sponsorship-opportunities">
                    <Button
                      variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to List
                    </Button>
                  </Link>
                </div>
                </CardContent>
              </Card>
            )}
              </div>
            </div>
      </div>
    </Layout>
  );
}
