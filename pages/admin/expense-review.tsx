import React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import ExpenseReviewTable from "@/components/admin/ExpenseReviewTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ExpenseReviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Handle query parameters for filters
  const { startupId, startupCallId, status: expenseStatus } = router.query;

  // Redirect if not admin, reviewer or sponsor
  React.useEffect(() => {
    if (
      status === "authenticated" &&
      !["ADMIN", "REVIEWER", "SPONSOR"].includes(session?.user?.role as string)
    ) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <>
      <Head>
        <title>Expense Review | Admin Dashboard</title>
      </Head>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Expense Review</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-amber-600" />
                Pending Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/expense-review?status=PENDING" passHref>
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Approved Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/expense-review?status=APPROVED" passHref>
                <Button variant="outline" className="w-full">
                  View History
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                All Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/expense-review" passHref>
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <ExpenseReviewTable
          startupId={startupId as string | undefined}
          startupCallId={startupCallId as string | undefined}
          defaultStatus={expenseStatus as string | undefined}
        />
      </div>
    </>
  );
}
