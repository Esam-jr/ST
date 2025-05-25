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
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
}

interface StartupExpenses {
  totalExpenses: number;
  remainingBudget: number;
  categories: ExpenseCategory[];
  lastUpdate: string;
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
  expenses?: StartupExpenses;
  milestones?: {
    total: number;
    completed: number;
    nextMilestone?: string;
    nextDeadline?: string;
  };
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
                expenses: winner.expenses,
                milestones: winner.milestones,
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
          Track the progress and expenses of startups you're supporting
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
                        From {startup.startupCallTitle}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(
                        startup.sponsorshipAmount,
                        startup.sponsorshipCurrency
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Sponsored</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium">{startup.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-medium">{startup.stage}</p>
                    </div>
                    {startup.milestones && (
                      <div>
                        <p className="text-sm text-muted-foreground">Milestones</p>
                        <p className="font-medium">
                          {startup.milestones.completed} of {startup.milestones.total} Completed
                        </p>
                      </div>
                    )}
                    {startup.website && (
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a
                          href={startup.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          Visit Site
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Budget Progress */}
                  {startup.expenses && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Budget Utilization</h4>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {format(new Date(startup.expenses.lastUpdate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              startup.expenses.remainingBudget,
                              startup.sponsorshipCurrency
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">Remaining</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={
                            (startup.expenses.totalExpenses /
                              startup.sponsorshipAmount) *
                            100
                          }
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(
                              startup.expenses.totalExpenses,
                              startup.sponsorshipCurrency
                            )}{" "}
                            spent
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(
                              (startup.expenses.totalExpenses /
                                startup.sponsorshipAmount) *
                                100
                            )}
                            % of budget
                          </span>
                        </div>
                      </div>

                      {/* Expense Categories */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="expenses">
                          <AccordionTrigger>
                            View Expense Breakdown
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              {startup.expenses.categories.map((category) => (
                                <div
                                  key={category.name}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {category.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {category.percentage}% of total expenses
                                    </p>
                                  </div>
                                  <p className="font-medium">
                                    {formatCurrency(
                                      category.amount,
                                      startup.sponsorshipCurrency
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  {/* Next Milestone */}
                  {startup.milestones?.nextMilestone && (
                    <div className="bg-primary/5 rounded-lg p-4">
                      <h4 className="font-medium">Next Milestone</h4>
                      <p className="text-sm mt-1">
                        {startup.milestones.nextMilestone}
                      </p>
                      {startup.milestones.nextDeadline && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Due by:{" "}
                          {format(
                            new Date(startup.milestones.nextDeadline),
                            "MMM d, yyyy"
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/sponsored-startups/${startup.startupId}`}
                    className="flex items-center"
                  >
                    View Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {startups.length === 0 && (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Once your sponsorship application is approved and a winner is
              selected for the startup call, they will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
