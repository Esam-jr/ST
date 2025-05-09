"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import StartupList from "../../components/dashboard/StartupList";
import TasksList from "../../components/dashboard/TasksList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import { DashboardHeader } from "@/components/dashboard-header";
import { FinancialSummary } from "@/components/sponsor/FinancialSummary";
import { ActiveSponsorships } from "@/components/sponsor/ActiveSponsorships";
import { OpportunityExplorer } from "@/components/sponsor/OpportunityExplorer";
import { SponsorshipApplications } from "@/components/sponsor/SponsorshipApplications";
import { Loader2, ExternalLink, BarChart4 } from "lucide-react";

// Define extended session user type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function SponsorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or not a sponsor
  useEffect(() => {
    // Wait until session is loaded
    if (status === "loading") return;

    // Check if user is logged in
    if (!session) {
      console.log("No session found, redirecting to login page");
      router.push("/login?callbackUrl=/sponsor-dashboard");
      return;
    }

    // Check if user has the SPONSOR role
    const userRole = session?.user?.role;
    console.log("User role:", userRole);

    if (userRole !== "SPONSOR") {
      console.log("User is not a sponsor, redirecting to home page");
      router.push("/");
      return;
    }

    // If we reach here, the user is authenticated and has the sponsor role
    setIsLoading(false);
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Sponsor Dashboard | Startup Platform</title>
        <meta
          name="description"
          content="Manage your sponsorships and explore new opportunities."
        />
      </Head>
      <Layout>
        <DashboardHeader
          heading="Sponsor Dashboard"
          text="Manage your sponsorships and explore new opportunities."
        >
          <Button variant="outline" className="ml-auto">
            <a
              href="/sponsor-guide.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              Sponsor Guide
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </DashboardHeader>

        <div className="grid gap-8">
          {/* Financial Summary Section */}
          <FinancialSummary />

          {/* Main Dashboard Content */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Active Sponsorships</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <ActiveSponsorships />
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <SponsorshipApplications />
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              <OpportunityExplorer />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5" />
                    Sponsorship Insights
                  </CardTitle>
                  <CardDescription>
                    Track the impact and performance of your sponsorships.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="mb-4 text-muted-foreground">
                      Detailed sponsorship analytics coming soon.
                    </p>
                    <Button variant="outline" size="sm">
                      Request Early Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
}
