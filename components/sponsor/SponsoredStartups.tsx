import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Loader2,
  ExternalLink,
  Building,
  GraduationCap,
  Calendar,
  Globe,
  TrendingUp,
} from "lucide-react";

// Define types
interface Founder {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface StartupDetails {
  id: string | null;
  name: string | null;
  logo: string | null;
  website: string | null;
  industry: string | null;
}

interface SponsoredStartup {
  sponsorshipApplicationId: string;
  sponsorshipAmount: number;
  sponsorshipCurrency: string;
  opportunityId: string;
  opportunityTitle: string;
  startupCallId: string;
  startupCallTitle: string;
  applicationId: string;
  startupId: string | null;
  startupName: string;
  website: string | null;
  industry: string;
  stage: string;
  description: string;
  founderDetails: Founder;
  startupDetails: StartupDetails | null;
}

export default function SponsoredStartups() {
  const { data: session } = useSession();
  const [startups, setStartups] = useState<SponsoredStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSponsoredStartups = async () => {
      try {
        setLoading(true);

        // First get the approved applications
        const appResponse = await axios.get("/api/sponsors/me/applications", {
          params: { status: "APPROVED" },
        });

        const approvedApplications = appResponse.data;
        const startupCalls = new Set(
          approvedApplications
            .filter((app: any) => app.opportunity?.startupCallId)
            .map((app: any) => app.opportunity.startupCallId)
        );

        if (startupCalls.size === 0) {
          setLoading(false);
          return;
        }

        // For each startup call, fetch the winning application
        const winningStartups: SponsoredStartup[] = [];

        for (const application of approvedApplications) {
          const startupCallId = application.opportunity.startupCallId;
          if (!startupCallId) continue;

          try {
            // Fetch the startup call details to get the winner
            const callResponse = await axios.get(
              `/api/startup-calls/${startupCallId}`
            );
            const callData = callResponse.data;

            // Fetch the applications for this call
            const applicationsResponse = await axios.get(
              `/api/startup-calls/${startupCallId}/applications`
            );
            const callApplications = applicationsResponse.data;

            // Find the winning application
            const winner = callApplications.find(
              (app: any) => app.status === "SELECTED" || app.status === "WINNER"
            );

            if (winner) {
              winningStartups.push({
                sponsorshipApplicationId: application.id,
                sponsorshipAmount: application.amount,
                sponsorshipCurrency: application.currency,
                opportunityId: application.opportunity.id,
                opportunityTitle: application.opportunity.title,
                startupCallId: startupCallId,
                startupCallTitle: callData.title,
                applicationId: winner.id,
                startupId: winner.startupId,
                startupName: winner.startupName,
                website: winner.website,
                industry: winner.industry,
                stage: winner.stage,
                description: winner.description,
                founderDetails: winner.user,
                startupDetails: winner.startup,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching data for startup call ${startupCallId}:`,
              error
            );
          }
        }

        setStartups(winningStartups);
      } catch (error) {
        console.error("Error fetching sponsored startups:", error);
        toast({
          title: "Error",
          description:
            "Failed to load your sponsored startups. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchSponsoredStartups();
    }
  }, [session, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (startups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sponsored Startups</CardTitle>
          <CardDescription>
            You don't have any sponsored startups yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Once your sponsorship application is approved and a winner is
              selected for the startup call, they will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsored Startups</CardTitle>
        <CardDescription>
          Startups you're supporting through your sponsorships
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {startups.map((startup) => (
            <Card key={startup.sponsorshipApplicationId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={startup.startupDetails?.logo || ""}
                        alt={startup.startupName}
                      />
                      <AvatarFallback>
                        {startup.startupName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{startup.startupName}</CardTitle>
                      <CardDescription className="mt-1">
                        From {startup.startupCallTitle} | Sponsored:{" "}
                        {formatCurrency(
                          startup.sponsorshipAmount,
                          startup.sponsorshipCurrency
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{startup.description}</p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{startup.industry}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{startup.stage}</span>
                  </div>
                  {startup.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {startup.website}
                      </a>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={startup.founderDetails?.image || ""}
                      alt={startup.founderDetails?.name}
                    />
                    <AvatarFallback>
                      {startup.founderDetails?.name
                        ?.substring(0, 2)
                        .toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {startup.founderDetails?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Founder</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <a href={`/startups/${startup.startupId}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Startup Details
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
