import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Layout from '@/components/layout/Layout';
import SponsorshipOpportunityList from '@/components/admin/sponsorship/SponsorshipOpportunityList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface DashboardStats {
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  totalAmount: number;
}

export default function SponsorshipOpportunitiesPage({
  initialStats,
}: {
  initialStats: DashboardStats;
}) {
  const [stats, setStats] = useState(initialStats);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/sponsorship-opportunities/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Opportunities
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalOpportunities || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total opportunities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Opportunities
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeOpportunities || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active opportunities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalApplications || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total applications
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats?.totalAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total sponsorship value
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="opportunities" className="space-y-4">
            <SponsorshipOpportunityList onStatsChange={fetchStats} />
          </TabsContent>
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  View and manage sponsorship applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Applications list component will go here */}
                <p className="text-muted-foreground">
                  Applications management coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  View sponsorship opportunity analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Analytics component will go here */}
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Check authentication
    const session = await getServerSession(context.req, context.res, authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return {
        redirect: {
          destination: '/auth/signin?callbackUrl=/admin/sponsorship-opportunities',
          permanent: false,
        },
      };
    }

    // Get the host from the request headers
    const host = context.req.headers.host;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Fetch initial stats
    const statsRes = await fetch(`${baseUrl}/api/admin/sponsorship-opportunities/stats`);
    
    if (!statsRes.ok) {
      throw new Error(`Failed to fetch stats: ${statsRes.statusText}`);
    }

    const initialStats = await statsRes.json();

    return {
      props: {
        initialStats,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // Return default stats on error
    return {
      props: {
        initialStats: {
          totalOpportunities: 0,
          activeOpportunities: 0,
          totalApplications: 0,
          totalAmount: 0,
        },
      },
    };
  }
};
