"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import SponsorLayout from "@/components/sponsor/SponsorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApplicationsTable from "@/components/sponsor/ApplicationsTable";
import SponsoredStartups from "@/components/sponsor/SponsoredStartups";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Building2, CheckCircle2, Clock, DollarSign, Users } from "lucide-react";
import axios from "axios";

// Define extended session user type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface DashboardStats {
  totalSponsored: number;
  totalAmount: number;
  currency: string;
  pendingApplications: number;
  preApprovedApplications: number;
  approvedApplications: number;
  activeStartups: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/sponsor-dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('/api/sponsors/me/dashboard-stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (session?.user) {
      fetchDashboardStats();
      setLoading(false);
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <SponsorLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h3 className="text-lg font-medium mt-4">Loading...</h3>
          </div>
        </div>
      </SponsorLayout>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user as ExtendedUser;
  const userRole = user?.role || "USER";

  if (userRole !== "SPONSOR") {
    router.push("/dashboard");
    return null;
  }

  const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SponsorLayout>
      <Head>
        <title>Sponsor Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your sponsorships
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sponsored"
              value={`${stats.currency} ${stats.totalAmount.toLocaleString()}`}
              icon={DollarSign}
            />
            <StatCard
              title="Active Startups"
              value={stats.activeStartups}
              icon={Building2}
              trend="+2 this month"
            />
            <StatCard
              title="Pending Applications"
              value={stats.pendingApplications}
              icon={Clock}
            />
            <StatCard
              title="Approved Applications"
              value={stats.approvedApplications}
              icon={CheckCircle2}
            />
          </div>
        )}
        
        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2"
              asChild
            >
              <Link href="/sponsorship-opportunities">
                <Users className="h-6 w-6" />
                <span>Browse Opportunities</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2"
              asChild
            >
              <Link href="/sponsor-dashboard/startups">
                <Building2 className="h-6 w-6" />
                <span>View Sponsored Startups</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SponsorLayout>
  );
}
