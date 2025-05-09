import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Search,
  ArrowRight,
  Building,
  Globe,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

// Types
type CallStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: CallStatus;
  applicationDeadline: string;
  publishedDate: string;
  industry: string;
  location: string;
  fundingAmount?: string;
  requirements: string[];
}

export default function PublicStartupCalls() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [calls, setCalls] = useState<StartupCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<StartupCall[]>([]);
  const { toast } = useToast();

  // Fetch data - no authentication check needed for public page
  useEffect(() => {
    const fetchStartupCalls = async () => {
      try {
        setLoading(true);
        // Update to use the main API endpoint with filter for published calls
        const response = await axios.get("/api/startup-calls", {
          params: { status: "PUBLISHED" },
        });
        setCalls(response.data);
        setFilteredCalls(response.data);
      } catch (error) {
        console.error("Error fetching startup calls:", error);

        toast({
          title: "Connection issue",
          description:
            "Unable to fetch startup calls. Using demo data instead.",
          variant: "destructive",
        });

        // Create fake data if API fails
        const mockCalls: StartupCall[] = [
          {
            id: "1",
            title: "Green Technology Innovation Fund",
            description:
              "Funding for startups working on sustainable technologies and renewable energy solutions.",
            status: "PUBLISHED",
            applicationDeadline: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            publishedDate: new Date().toISOString(),
            industry: "CleanTech",
            location: "Global",
            fundingAmount: "Up to $500,000",
            requirements: [
              "Early Stage",
              "Sustainability Focus",
              "Innovative Technology",
            ],
          },
          {
            id: "2",
            title: "HealthTech Accelerator Program",
            description:
              "Supporting innovative healthcare startups with funding and mentorship.",
            status: "PUBLISHED",
            applicationDeadline: new Date(
              Date.now() + 15 * 24 * 60 * 60 * 1000
            ).toISOString(),
            publishedDate: new Date().toISOString(),
            industry: "Healthcare",
            location: "Europe",
            fundingAmount: "Up to $250,000",
            requirements: [
              "Seed Stage",
              "Healthcare Innovation",
              "Technical Team",
            ],
          },
          {
            id: "3",
            title: "AI & Machine Learning Venture Fund",
            description:
              "Investment fund for startups leveraging artificial intelligence and machine learning technologies.",
            status: "PUBLISHED",
            applicationDeadline: new Date(
              Date.now() + 45 * 24 * 60 * 60 * 1000
            ).toISOString(),
            publishedDate: new Date().toISOString(),
            industry: "Artificial Intelligence",
            location: "Global",
            fundingAmount: "Up to $1,000,000",
            requirements: ["AI/ML Focus", "Proven Technology", "Growth Stage"],
          },
          {
            id: "4",
            title: "EdTech Innovation Challenge",
            description:
              "Funding and support for startups transforming education through technology.",
            status: "PUBLISHED",
            applicationDeadline: new Date(
              Date.now() + 60 * 24 * 60 * 60 * 1000
            ).toISOString(),
            publishedDate: new Date().toISOString(),
            industry: "Education Technology",
            location: "North America",
            fundingAmount: "Up to $300,000",
            requirements: [
              "Education Focus",
              "Technology Solution",
              "Early Traction",
            ],
          },
        ];

        setCalls(mockCalls);
        setFilteredCalls(mockCalls);
      } finally {
        setLoading(false);
      }
    };

    fetchStartupCalls();
  }, [toast]);

  // Filter calls based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCalls(calls);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = calls.filter(
        (call) =>
          call.title.toLowerCase().includes(term) ||
          call.description.toLowerCase().includes(term) ||
          call.industry.toLowerCase().includes(term) ||
          call.location.toLowerCase().includes(term)
      );
      setFilteredCalls(filtered);
    }
  }, [searchTerm, calls]);

  // Helper functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Layout title="Public Startup Calls | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Public Startup Calls">
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Public Startup Calls
                </h1>
                <p className="text-muted-foreground mt-1">
                  Browse open funding opportunities and programs for startups
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, industry, or location..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium">No startup calls found</p>
              <p className="mt-1 text-muted-foreground">
                Try adjusting your search or check back later for new
                opportunities
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCalls.map((call) => {
                // Only show published calls that aren't expired
                if (
                  call.status !== "PUBLISHED" ||
                  getDaysLeft(call.applicationDeadline) <= 0
                ) {
                  return null;
                }

                return (
                  <Card
                    key={call.id}
                    className="overflow-hidden transition-all hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-2 text-xl">
                        {call.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-muted-foreground">
                        {call.description}
                      </p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Deadline: {formatDate(call.applicationDeadline)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {getDaysLeft(call.applicationDeadline)} days left to
                            apply
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{call.industry}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{call.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {call.requirements.slice(0, 3).map((req, idx) => (
                          <Badge key={idx} variant="outline">
                            {req}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        className="mt-6 w-full"
                        onClick={() => router.push(`/startup-calls/${call.id}`)}
                      >
                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
