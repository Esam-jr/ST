import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import SponsorLayout from "@/components/sponsor/SponsorLayout";
import ApplicationsTable from "@/components/sponsor/ApplicationsTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Applications() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
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
    router.push("/auth/signin?callbackUrl=/sponsor-dashboard/applications");
    return null;
  }

  const userRole = session.user?.role || "USER";
  if (userRole !== "SPONSOR") {
    router.push("/dashboard");
    return null;
  }

  return (
    <SponsorLayout>
      <Head>
        <title>Sponsorship Applications | Sponsor Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sponsorship Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your sponsorship applications
          </p>
        </div>

        <ApplicationsTable />
      </div>
    </SponsorLayout>
  );
} 