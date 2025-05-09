import Head from "next/head";
import { Layout } from "@/components/layout";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SponsorGuide() {
  return (
    <>
      <Head>
        <title>Sponsor Guide | Startup Platform</title>
        <meta
          name="description"
          content="A guide for sponsors on how to effectively sponsor startups"
        />
      </Head>

      <Layout>
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sponsor-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <DashboardHeader
          heading="Sponsor Guide"
          text="All the information you need to get started with sponsoring startups"
        />

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>Sponsor Guide PDF</CardTitle>
                  <CardDescription>
                    Download our comprehensive guide for sponsors
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center bg-muted/50">
                <div className="text-center max-w-md space-y-4">
                  <h3 className="text-xl font-semibold">Sponsor Guide PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Our complete guide to sponsoring startups, including best
                    practices, tips for selecting opportunities, and maximizing
                    the impact of your sponsorship.
                  </p>
                  <Button className="mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF (Coming Soon)
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">What's Inside:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Overview of the startup sponsorship process</li>
                  <li>How to evaluate startup opportunities</li>
                  <li>Guidelines for determining sponsorship amounts</li>
                  <li>Understanding the benefits of sponsorship</li>
                  <li>Tax considerations for sponsors</li>
                  <li>Success stories and case studies</li>
                  <li>FAQ for sponsors</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Assistance?</CardTitle>
              <CardDescription>
                Our team is here to help you with any questions about sponsoring
                startups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions or need personalized assistance,
                please don't hesitate to contact our sponsor support team.
              </p>
              <Button variant="outline">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}
