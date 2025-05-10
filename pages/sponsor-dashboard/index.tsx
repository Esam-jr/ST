"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApplicationsTable from "@/components/sponsor/ApplicationsTable";
import SponsoredStartups from "@/components/sponsor/SponsoredStartups";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState("applications");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/sponsor-dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Layout title="Loading | Sponsor Dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h3 className="text-lg font-medium mt-4">Loading...</h3>
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

  // Only allow sponsors to access this page
  if (userRole !== "SPONSOR") {
    router.push("/dashboard");
    return null;
  }

  return (
    <Layout title="Sponsor Dashboard | Startup Call Management System">
      <Head>
        <title>Sponsor Dashboard</title>
      </Head>
      <div className="min-h-screen">
        <header className="bg-card/80 backdrop-blur-sm shadow sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                Sponsor Dashboard
              </h1>
              <Button variant="outline">
                <Link href="/sponsorship-opportunities">
                  View Opportunities
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="startups">Sponsored Startups</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              <ApplicationsTable />
            </TabsContent>

            <TabsContent value="startups" className="space-y-4">
              <SponsoredStartups />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}
