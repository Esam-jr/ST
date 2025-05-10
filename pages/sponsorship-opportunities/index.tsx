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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  ArrowRight,
  Clock,
  Building,
  Star,
  Info,
  LogIn,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import axios from "axios";

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
  };
}

export default function PublicSponsorshipOpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>(
    []
  );
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    SponsorshipOpportunity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Filter opportunities whenever search query changes
  useEffect(() => {
    if (opportunities.length > 0) {
      const filtered = opportunities.filter(
        (opportunity) =>
          opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opportunity.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredOpportunities(filtered);
    }
  }, [searchQuery, opportunities]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      // Use the new public API endpoint
      const response = await axios.get("/api/public/sponsorship-opportunities");
      setOpportunities(response.data);
      setFilteredOpportunities(response.data);
    } catch (error) {
      console.error("Error fetching sponsorship opportunities:", error);
      toast({
        title: "Error loading opportunities",
        description:
          "Failed to load sponsorship opportunities. Please try again later.",
        variant: "destructive",
      });

      // Set empty arrays when API fails instead of using mock data
      setOpportunities([]);
      setFilteredOpportunities([]);
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
  const formatDate = (dateString: string) => {
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

  // Handle opportunity card click
  const handleOpportunityClick = (opportunityId: string) => {
    router.push(`/sponsorship-opportunities/${opportunityId}`);
  };

  return (
    <Layout title="Sponsorship Opportunities">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sponsorship Opportunities</h1>
            <p className="text-gray-600 mt-1">
              Discover opportunities to sponsor promising startup initiatives
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search opportunities..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-2">
                No sponsorship opportunities are currently available.
              </p>
              <p className="text-gray-500">Please check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      {opportunity.title}
                    </CardTitle>
                    <Badge
                      variant={
                        isDeadlinePassed(opportunity.deadline)
                          ? "destructive"
                          : "outline"
                      }
                      className="ml-2"
                    >
                      {isDeadlinePassed(opportunity.deadline)
                        ? "Deadline Passed"
                        : "Active"}
                    </Badge>
                  </div>
                  {opportunity.startupCall?.title && (
                    <CardDescription>
                      <span className="flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        {opportunity.startupCall.title}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="line-clamp-3 text-muted-foreground mb-4">
                    {opportunity.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>
                        {formatCurrency(
                          opportunity.minAmount,
                          opportunity.currency
                        )}{" "}
                        -{" "}
                        {formatCurrency(
                          opportunity.maxAmount,
                          opportunity.currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span
                        className={
                          isDeadlinePassed(opportunity.deadline)
                            ? "text-destructive"
                            : ""
                        }
                      >
                        {formatDate(opportunity.deadline || "")}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {!session ? (
                    <Link
                      href={`/auth/signin?callbackUrl=/sponsorship-opportunities/${opportunity.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        Sign In to Apply
                      </Button>
                    </Link>
                  ) : session.user?.role === "SPONSOR" ? (
                    <Link
                      href={`/sponsorship-opportunities/${opportunity.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="default"
                        className="w-full flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/sponsorship-opportunities/${opportunity.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Info className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!session && (
          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 text-lg mb-1">
                    Are you a potential sponsor?
                  </h3>
                  <p className="text-blue-700">
                    Sign in or create an account to apply for sponsorship
                    opportunities and support promising startups.
                  </p>
                </div>
              </div>
              <Link href="/auth/signin?callbackUrl=/sponsorship-opportunities">
                <Button
                  variant="default"
                  className="min-w-[150px] flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
