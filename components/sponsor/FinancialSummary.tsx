import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  DollarSign,
  HandCoins,
  ListChecks,
  TrendingUp,
} from "lucide-react";

// Define interfaces
interface Sponsorship {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  startupCallId: string;
  startupCall?: {
    id: string;
    title: string;
  };
}

interface SponsorApplication {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: string;
}

interface SponsorStats {
  totalInvestment: number;
  activeSponshorships: number;
  pendingApplications: number;
  averageAmount: number;
  primaryCurrency: string;
}

export function FinancialSummary() {
  const [stats, setStats] = useState<SponsorStats>({
    totalInvestment: 0,
    activeSponshorships: 0,
    pendingApplications: 0,
    averageAmount: 0,
    primaryCurrency: "USD",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sponsorships
      console.log("Fetching sponsorships for current sponsor");
      const sponsorshipsResponse = await axios.get(
        "/api/sponsors/me/sponsorships"
      );
      const sponsorships = sponsorshipsResponse.data;
      console.log(
        `Found ${sponsorships.length} sponsorships for current sponsor`
      );

      // Fetch applications
      console.log("Fetching applications for current sponsor");
      const applicationsResponse = await axios.get(
        "/api/sponsors/me/applications"
      );
      const applications = applicationsResponse.data;
      console.log(
        `Found ${applications.length} applications for current sponsor`
      );

      // Calculate stats
      // Filter active sponsorships (those with status="active" or without a status field)
      const activeSponshorships = sponsorships.filter(
        (s: Sponsorship) => !s.status || s.status.toLowerCase() === "active"
      );

      // Filter pending applications
      const pendingApplications = applications.filter(
        (app: any) => app.status && app.status.toLowerCase() === "pending"
      ).length;

      // Set primary currency based on most recent sponsorship, or default to USD
      const primaryCurrency =
        sponsorships.length > 0 ? sponsorships[0].currency : "USD";

      // Calculate total investment (sum of all sponsorship amounts)
      const totalInvestment = sponsorships.reduce(
        (total: number, s: Sponsorship) => total + s.amount,
        0
      );

      // Calculate average sponsorship amount
      let averageAmount = 0;
      if (activeSponshorships.length > 0) {
        averageAmount = totalInvestment / activeSponshorships.length;
      }

      // Set stats
      setStats({
        totalInvestment,
        activeSponshorships: activeSponshorships.length,
        pendingApplications,
        averageAmount,
        primaryCurrency,
      });
    } catch (err: any) {
      console.error("Error fetching financial stats:", err);
      setError("Failed to load financial summary");
      toast({
        title: "Error",
        description: "Could not load financial summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="mb-2 text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>
          Overview of your sponsorship investments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Investment Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Investment
                  </p>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalInvestment, stats.primaryCurrency)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Sponsorships Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Sponsorships
                  </p>
                  <HandCoins className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {stats.activeSponshorships}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Applications Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Applications
                  </p>
                  <ListChecks className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {stats.pendingApplications}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Average Sponsorship Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Sponsorship
                  </p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.averageAmount, stats.primaryCurrency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="ml-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}
