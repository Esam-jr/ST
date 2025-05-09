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
import Head from "next/head";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpportunityExplorer } from "@/components/sponsor/OpportunityExplorer";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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

export default function SponsorshipOpportunities() {
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
  const [industryFilter, setIndustryFilter] = useState("all");
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    fetchOpportunities();
    fetchIndustries();
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

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      // This endpoint might need to be created if it doesn't exist
      const response = await axios.get("/api/public/industries");
      if (response.data && Array.isArray(response.data)) {
        setIndustries(response.data);
      } else {
        // Fallback to some common industries if the API isn't available
        setIndustries([
          "Technology",
          "Healthcare",
          "Education",
          "Finance",
          "Sustainable",
          "Manufacturing",
          "Retail",
          "AI",
        ]);
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
      // Fallback to some common industries
      setIndustries([
        "Technology",
        "Healthcare",
        "Education",
        "Finance",
        "Sustainable",
        "Manufacturing",
        "Retail",
        "AI",
      ]);
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle industry filter change
  const handleIndustryChange = (value: string) => {
    setIndustryFilter(value);
  };

  return (
    <>
      <Head>
        <title>Sponsorship Opportunities | Startup Platform</title>
        <meta
          name="description"
          content="Browse and explore sponsorship opportunities for startups"
        />
      </Head>

      <Layout>
        <DashboardHeader
          heading="Sponsorship Opportunities"
          text="Discover and support innovative startups through sponsorships"
        />

        <div className="space-y-8">
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search opportunities..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="w-full sm:w-48 flex items-center">
              <Select
                value={industryFilter}
                onValueChange={handleIndustryChange}
                disabled={loading}
              >
                <SelectTrigger className="gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {loading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    industries.map((industry) => (
                      <SelectItem key={industry} value={industry.toLowerCase()}>
                        {industry}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Opportunities section */}
          <OpportunityExplorer
            initialSearchQuery={searchQuery}
            industryFilter={
              industryFilter !== "all" ? industryFilter : undefined
            }
          />
        </div>
      </Layout>
    </>
  );
}
