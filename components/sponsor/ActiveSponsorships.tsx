import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  RefreshCw,
  DollarSign,
  Calendar,
  Building,
  Rocket,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

// Define types
interface Sponsorship {
  id: string;
  amount: number;
  currency: string;
  date: string;
  startup: {
    id: string;
    name: string;
    logo?: string;
    industry?: string;
    stage?: string;
  };
  startupCall?: {
    id: string;
    title: string;
  };
}

interface ActiveSponsorshipsProps {
  limit?: number;
}

export function ActiveSponsorships({ limit }: ActiveSponsorshipsProps) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/sponsors/me/sponsorships");
      let data = response.data;

      // Apply limit if specified
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }

      setSponsorships(data);
    } catch (err: any) {
      console.error("Error fetching sponsorships:", err);
      setError("Failed to load sponsorships");
      toast({
        title: "Error",
        description: "Could not load your sponsorships. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get appropriate icon for industry
  const getIndustryIcon = (industry?: string) => {
    if (!industry) return <Building className="h-4 w-4" />;

    // You can expand this with more industry-specific icons
    return <Building className="h-4 w-4" />;
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
            <Button variant="outline" size="sm" onClick={fetchSponsorships}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sponsorships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sponsorships</CardTitle>
          <CardDescription>
            Your current sponsorships will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <p className="mb-4 text-muted-foreground">
            You don't have any active sponsorships yet.
          </p>
          <Button asChild>
            <Link href="/sponsorship-opportunities">
              Browse Opportunities
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sponsorships</CardTitle>
        <CardDescription>Your current active sponsorships.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {sponsorships.map((sponsorship) => (
            <Card key={sponsorship.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {sponsorship.startup.name}
                    </h3>
                    {sponsorship.startup.industry && (
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        {getIndustryIcon(sponsorship.startup.industry)}
                        <span className="ml-1">
                          {sponsorship.startup.industry}
                        </span>
                      </div>
                    )}
                  </div>
                  {sponsorship.startup.stage && (
                    <Badge variant="outline" className="flex items-center">
                      <Rocket className="mr-1 h-3 w-3" />
                      {sponsorship.startup.stage}
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Amount
                    </p>
                    <p className="font-medium flex items-center">
                      <DollarSign className="h-4 w-4 text-primary mr-1" />
                      {formatCurrency(sponsorship.amount, sponsorship.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date
                    </p>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-1" />
                      {formatDate(sponsorship.date)}
                    </p>
                  </div>
                </div>
                {sponsorship.startupCall && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">
                      Startup Call
                    </p>
                    <p className="text-sm">{sponsorship.startupCall.title}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/20 p-4">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/startups/${sponsorship.startup.id}`}>
                    View Startup Details
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
      {limit && sponsorships.length >= limit && (
        <CardFooter className="flex justify-center border-t pt-6">
          <Button variant="outline" asChild>
            <Link href="/sponsor-dashboard/sponsorships">
              View All Sponsorships
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
