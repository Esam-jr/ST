import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { ActiveSponsorships } from "@/components/sponsor/ActiveSponsorships";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SponsorSponsorshipsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/sponsor-dashboard/sponsorships");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "SPONSOR"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <Layout title="Loading | My Sponsorships">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-medium">Loading...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== "SPONSOR") {
    return null; // Will redirect in the useEffect
  }

  return (
    <Layout title="My Sponsorships | Sponsor Dashboard">
      <div className="min-h-screen">
        <header className="bg-card/80 backdrop-blur-sm shadow relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                My Sponsorships
              </h1>
              <Button variant="outline">
                <Link href="/sponsor-dashboard" className="flex items-center">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ActiveSponsorships />
        </main>
      </div>
    </Layout>
  );
}
