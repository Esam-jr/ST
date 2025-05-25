import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Layout from '@/components/layout/Layout';
import SponsorshipOpportunityList from '@/components/admin/sponsorship/SponsorshipOpportunityList';
import ApplicationManagement from '@/components/admin/sponsorship/ApplicationManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface DashboardStats {
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  totalAmount: number;
  pendingApplications: number;
}

export default function SponsorshipOpportunitiesPage({
  initialStats,
}: {
  initialStats: DashboardStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState("opportunities");

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
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Sponsorship Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage sponsorship opportunities and applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOpportunities}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
          <TabsContent value="opportunities" className="space-y-4">
            <SponsorshipOpportunityList onStatsChange={fetchStats} />
          </TabsContent>
          <TabsContent value="applications" className="space-y-4">
            <ApplicationManagement />
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
          pendingApplications: 0,
        },
      },
    };
  }
};
