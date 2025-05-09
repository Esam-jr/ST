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
  Search,
  Calendar as CalendarIcon,
  Building,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";

// Define types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  benefits: string[];
  status: string;
  deadline?: string;
  startupCall?: {
    id: string;
    title: string;
  };
}

interface OpportunityExplorerProps {
  limit?: number;
}

export function OpportunityExplorer({ limit }: OpportunityExplorerProps) {
  const [opportunities, setOpportunities] = useState<SponsorshipOpportunity[]>(
    []
  );
  const [filteredOpportunities, setFilteredOpportunities] = useState<
    SponsorshipOpportunity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Filter opportunities when search query changes
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
      setError(null);
      const response = await axios.get("/api/public/sponsorship-opportunities");
      let data = response.data;

      // Filter to only show open opportunities
      data = data.filter(
        (opp: SponsorshipOpportunity) =>
          opp.status.toLowerCase() === "open" &&
          (!opp.deadline || new Date(opp.deadline) > new Date())
      );

      // Apply limit if specified
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }

      setOpportunities(data);
      setFilteredOpportunities(data);
    } catch (err: any) {
      console.error("Error fetching opportunities:", err);
      setError("Failed to load opportunities");
      toast({
        title: "Error",
        description:
          "Could not load sponsorship opportunities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format amount range
  const formatAmountRange = (min: number, max: number, currency: string) => {
    if (min === max) {
      return formatCurrency(min, currency);
    }
    return `${formatCurrency(min, currency)} - ${formatCurrency(
      max,
      currency
    )}`;
  };

  // Days until deadline
  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return null;

    const deadline = new Date(dateString);
    const now = new Date();

    // Early return if deadline has passed
    if (deadline < now) return null;

    const diffTime = Math.abs(deadline.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
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
            <Button variant="outline" size="sm" onClick={fetchOpportunities}>
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
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Sponsorship Opportunities</CardTitle>
            <CardDescription>
              Discover opportunities that match your sponsorship goals.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search opportunities..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No matching opportunities found.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {opportunity.title}
                    </CardTitle>
                    {opportunity.deadline && (
                      <Badge
                        variant="outline"
                        className="flex items-center ml-2"
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {getDaysUntil(opportunity.deadline)} days left
                      </Badge>
                    )}
                  </div>
                  {opportunity.startupCall && (
                    <CardDescription className="flex items-center mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      {opportunity.startupCall.title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                    {opportunity.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Amount Range
                      </p>
                      <p className="font-medium flex items-center">
                        <DollarSign className="h-3 w-3 mr-1 text-primary" />
                        {formatAmountRange(
                          opportunity.minAmount,
                          opportunity.maxAmount,
                          opportunity.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Deadline
                      </p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-primary" />
                        {formatDate(opportunity.deadline)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 p-3">
                  <Button variant="default" size="sm" className="w-full">
                    <Link
                      href={`/sponsorship-opportunities/${opportunity.id}`}
                      className="flex items-center justify-center w-full"
                    >
                      View Details
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      {limit && opportunities.length > limit && (
        <CardFooter className="flex justify-center border-t pt-6">
          <Button variant="outline">
            <Link href="/sponsorship-opportunities">
              View All Opportunities
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
