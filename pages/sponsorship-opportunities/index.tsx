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
  slug: string;
  description: string;
  benefits: string[];
  industryFocus?: string;
  tags: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  deadline?: string;
  coverImage?: string;
  viewsCount: number;
  shareCount: number;
  visibility: string;
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Sponsorship Opportunities
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Support innovative startups and make a lasting impact
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search opportunities..."
                className="pl-10 pr-4 h-11 rounded-full border-gray-200 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card className="text-center">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                No opportunities found
              </p>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any sponsorship opportunities matching your search. Try adjusting your filters or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card 
                key={opportunity.id} 
                className="flex flex-col hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden"
              >
                {opportunity.coverImage ? (
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={opportunity.coverImage}
                      alt={opportunity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    <Building className="h-16 w-16 text-primary/20" />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl line-clamp-2">
                      {opportunity.title}
                    </CardTitle>
                    <Badge
                      variant={
                        isDeadlinePassed(opportunity.deadline)
                          ? "destructive"
                          : opportunity.visibility === "PRIVATE"
                          ? "outline"
                          : "default"
                      }
                      className="shrink-0"
                    >
                      {isDeadlinePassed(opportunity.deadline)
                        ? "Closed"
                        : opportunity.visibility === "PRIVATE"
                        ? "Private"
                        : "Active"}
                    </Badge>
                  </div>
                  {opportunity.startupCall?.title && (
                    <CardDescription className="flex items-center mt-2">
                      <Building className="h-4 w-4 mr-1 shrink-0" />
                      <span className="line-clamp-1">{opportunity.startupCall.title}</span>
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="line-clamp-2 text-muted-foreground mb-4">
                    {opportunity.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-2 text-primary" />
                      <span>
                        {formatCurrency(opportunity.minAmount, opportunity.currency)} -
                        {formatCurrency(opportunity.maxAmount, opportunity.currency)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <span className={isDeadlinePassed(opportunity.deadline) ? "text-destructive" : ""}>
                        {formatDate(opportunity.deadline || "")}
                      </span>
                    </div>

                    {opportunity.tags && opportunity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {opportunity.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {opportunity.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{opportunity.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {opportunity.viewsCount} views
                      </span>
                      {opportunity.industryFocus && (
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {opportunity.industryFocus}
                        </span>
                      )}
                    </div>

                    {!session ? (
                      <Link
                        href={`/auth/signin?callbackUrl=/sponsorship-opportunities/${opportunity.id}`}
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors"
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
                          className="w-full flex items-center justify-center gap-2"
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
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Info className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!session && (
          <div className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start">
                <Info className="h-8 w-8 text-primary mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Ready to Make an Impact?
                  </h3>
                  <p className="text-gray-600 max-w-xl">
                    Join our community of sponsors and support the next generation of innovative startups. Sign in or create an account to start your journey.
                  </p>
                </div>
              </div>
              <Link href="/auth/signin?callbackUrl=/sponsorship-opportunities">
                <Button
                  variant="default"
                  size="lg"
                  className="min-w-[180px] flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <LogIn className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
