import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import axios from "axios";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import { BudgetProvider } from "@/contexts/BudgetContext";
import BudgetManagementPanel from "@/components/admin/budget/BudgetManagementPanel";
import { getSession } from "next-auth/react";

interface BudgetManagementProps {
  startupCall: any;
}

export default function BudgetManagement({
  startupCall,
}: BudgetManagementProps) {
  return (
    <Layout>
      <BudgetProvider>
        <BudgetManagementPanel startupCallId={startupCall.id} />
      </BudgetProvider>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  const { id } = context.params as { id: string };

  try {
    const { data: startupCall } = await axios.get(
      `${process.env.NEXTAUTH_URL}/api/startup-calls/${id}`
    );

    return {
      props: {
        startupCall,
      },
    };
  } catch (error) {
    console.error("Error fetching startup call:", error);
    return {
      notFound: true,
    };
  }
};
