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

// Import new sponsor components
import { FinancialSummary } from "@/components/sponsor/FinancialSummary";
import { SponsorshipApplicationsTable } from "@/components/sponsor/SponsorshipApplicationsTable";
import { ActiveSponsorships } from "@/components/sponsor/ActiveSponsorships";
import { OpportunityExplorer } from "@/components/sponsor/OpportunityExplorer";

// Define extended session user type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Debug session information
  useEffect(() => {
    if (session) {
      console.log("User session:", session);
      console.log("User role:", session.user?.role);
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Layout title="Loading | Dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-medium">Loading...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null; // Will redirect in the useEffect
  }

  const user = session.user as ExtendedUser;
  const userRole = user?.role || "USER";

  return (
    <Layout title="Dashboard | Startup Call Management System">
      <div className="min-h-screen">
        <header className="bg-card/80 backdrop-blur-sm shadow relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <Button>
                <Link href="/submit" className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Submit Startup
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-muted/50 backdrop-blur-sm grid w-full grid-cols-2 md:w-auto md:grid-cols-5 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="startups">
                {userRole === "ENTREPRENEUR" ? "My Startups" : "Startups"}
              </TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              {userRole === "SPONSOR" && (
                <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
              )}
              {userRole === "REVIEWER" && (
                <TabsTrigger value="reviews">Review Assignments</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <DashboardStats userRole={userRole} />
            </TabsContent>

            <TabsContent value="startups" className="space-y-4">
              <StartupList userRole={userRole} userId={user?.id} />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <TasksList userId={user?.id} />
            </TabsContent>

            {userRole === "SPONSOR" && (
              <TabsContent value="sponsorships" className="space-y-6">
                <FinancialSummary />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActiveSponsorships limit={4} />
                  <SponsorshipApplicationsTable limit={4} />
                </div>

                <OpportunityExplorer limit={4} />
              </TabsContent>
            )}

            {userRole === "REVIEWER" && (
              <TabsContent value="reviews" className="space-y-4">
                <div className="rounded-lg bg-card p-6 shadow">
                  <h2 className="text-xl font-semibold">Review Assignments</h2>
                  <p className="text-muted-foreground mt-2">
                    Coming soon. We're working on implementing review assignment
                    features.
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}
