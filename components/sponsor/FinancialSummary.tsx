import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Rocket,
  Briefcase,
  BarChart4,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Sponsorship {
  id: string;
  amount: number;
  currency: string;
  date: string;
  startup: {
    id: string;
    name: string;
    industry?: string;
  };
}

interface SponsorStats {
  totalInvestment: number;
  activeSponshorships: number;
  pendingApplications: number;
  defaultCurrency: string;
}

export function FinancialSummary() {
  console.log("FinancialSummary component mounting");

  const [stats, setStats] = useState<SponsorStats>({
    totalInvestment: 0,
    activeSponshorships: 0,
    pendingApplications: 0,
    defaultCurrency: "USD",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("FinancialSummary useEffect running");
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log("FinancialSummary fetchStats starting");
    try {
      setLoading(true);
      setError(null);

      // Fetch sponsorships
      console.log("Fetching sponsorships");
      const sponsorshipsResponse = await axios.get(
        "/api/sponsors/me/sponsorships"
      );

      console.log("Sponsorships fetched:", sponsorshipsResponse.data);
      const sponsorships: Sponsorship[] = sponsorshipsResponse.data;

      // Fetch applications
      const applicationsResponse = await axios.get(
        "/api/sponsors/me/applications"
      );
      const applications = applicationsResponse.data;

      // Calculate stats
      const pendingApplications = applications.filter(
        (app) => app.status.toLowerCase() === "pending"
      ).length;

      let totalInvestment = 0;
      let defaultCurrency = "USD";

      if (sponsorships.length > 0) {
        // Use the currency of the most recent sponsorship as default
        defaultCurrency = sponsorships[0].currency;

        // Sum up all sponsorship amounts
        // Note: In a real application, you might want to handle currency conversion
        totalInvestment = sponsorships.reduce(
          (sum, item) => sum + item.amount,
          0
        );
      }

      setStats({
        totalInvestment,
        activeSponshorships: sponsorships.length,
        pendingApplications,
        defaultCurrency,
      });
    } catch (err: any) {
      console.error("Error fetching sponsor stats:", err);
      setError("Failed to load statistics");
      toast({
        title: "Error",
        description: "Could not load your financial summary. Please try again.",
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
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">
            {formatCurrency(stats.totalInvestment, stats.defaultCurrency)}
          </h3>
          <p className="text-sm text-muted-foreground">Total Investment</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">{stats.activeSponshorships}</h3>
          <p className="text-sm text-muted-foreground">Active Sponsorships</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">{stats.pendingApplications}</h3>
          <p className="text-sm text-muted-foreground">Pending Applications</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BarChart4 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">
            {stats.totalInvestment > 0
              ? (stats.totalInvestment / stats.activeSponshorships).toFixed(0)
              : 0}
            <span className="ml-1 text-sm font-normal">
              {stats.defaultCurrency}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">Avg. Sponsorship</p>
        </CardContent>
      </Card>
    </div>
  );
}
