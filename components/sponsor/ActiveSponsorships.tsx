import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  RefreshCw,
  DollarSign,
  Calendar,
  Building,
  LucideIcon,
  Briefcase,
  Cpu,
  Leaf,
  ShoppingBag,
  Wrench,
  Globe,
  Heart,
  BookOpen,
  Brain,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

// Define types
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
    industry?: string;
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
      console.log("Fetching sponsorships for the current sponsor");
      const response = await axios.get("/api/sponsors/me/sponsorships");
      console.log("Sponsorships response:", response.data);

      let data = response.data;

      // Filter sponsorships to only show active ones
      data = data.filter(
        (s: Sponsorship) => !s.status || s.status.toLowerCase() === "active"
      );
      console.log(`Found ${data.length} active sponsorships`);

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
        description:
          "Could not load your active sponsorships. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Get industry icon
  const getIndustryIcon = (industry?: string): LucideIcon => {
    if (!industry) return Briefcase;

    const industryLower = industry.toLowerCase();

    if (industryLower.includes("tech") || industryLower.includes("software")) {
      return Cpu;
    } else if (
      industryLower.includes("health") ||
      industryLower.includes("medical")
    ) {
      return Heart;
    } else if (industryLower.includes("edu")) {
      return BookOpen;
    } else if (
      industryLower.includes("green") ||
      industryLower.includes("sustain")
    ) {
      return Leaf;
    } else if (
      industryLower.includes("retail") ||
      industryLower.includes("commerce")
    ) {
      return ShoppingBag;
    } else if (industryLower.includes("manufacturing")) {
      return Wrench;
    } else if (
      industryLower.includes("ai") ||
      industryLower.includes("intelligence")
    ) {
      return Brain;
    } else if (
      industryLower.includes("global") ||
      industryLower.includes("international")
    ) {
      return Globe;
    }

    return Briefcase;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sponsorships</CardTitle>
        <CardDescription>
          Your current active sponsorship commitments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sponsorships.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No active sponsorships found
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              <Link
                href="/sponsorship-opportunities"
                className="flex items-center"
              >
                Explore Opportunities
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sponsorships.map((sponsorship) => {
              const IndustryIcon = getIndustryIcon(
                sponsorship.startupCall?.industry
              );

              return (
                <Card key={sponsorship.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {sponsorship.startupCall?.title ||
                            "Unnamed Startup Call"}
                        </CardTitle>
                        {sponsorship.startupCall?.industry && (
                          <CardDescription className="flex items-center mt-1">
                            <IndustryIcon className="h-3 w-3 mr-1" />
                            {sponsorship.startupCall.industry}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Amount
                        </p>
                        <p className="font-medium flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-primary" />
                          {formatCurrency(
                            sponsorship.amount,
                            sponsorship.currency
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Date
                        </p>
                        <p className="font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-primary" />
                          {formatDate(sponsorship.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/20 p-3">
                    <Button variant="default" size="sm" className="w-full">
                      <Link
                        href={`/sponsorships/${sponsorship.id}`}
                        className="flex items-center justify-center w-full"
                      >
                        View Details
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
      {limit && sponsorships.length > limit && (
        <CardFooter className="flex justify-center border-t pt-6">
          <Button variant="outline">
            <Link href="/sponsorships" className="flex items-center">
              View All Sponsorships
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
