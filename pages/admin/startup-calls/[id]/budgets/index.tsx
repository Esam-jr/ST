import React from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { BudgetProvider } from "@/contexts/BudgetContext";
import BudgetManagementPanel from "@/components/admin/budget/BudgetManagementPanel";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default function BudgetManagementPage({
  startupCallId,
}: {
  startupCallId: string;
}) {
  return (
    <>
      <Head>
        <title>Budget Management | Admin Dashboard</title>
        <meta
          name="description"
          content="Manage budgets and expenses for startup calls"
        />
      </Head>

      <BudgetProvider>
        <div className="container py-6 space-y-6">
          <BudgetManagementPanel initialStartupCallId={startupCallId} />
        </div>
      </BudgetProvider>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Verify the session and check admin access
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/admin",
        permanent: false,
      },
    };
  }

  // Get the startup call ID from the URL
  const startupCallId = context.params?.id as string;

  return {
    props: {
      startupCallId,
    },
  };
};
