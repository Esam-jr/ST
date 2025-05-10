import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define interface to match Prisma schema
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: Date | null;
  startupCallId: string | null;
  createdAt: Date;
  updatedAt: Date;
  startupCall?: {
    id: string;
    title: string;
  } | null;
  _count?: {
    applications: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Fetch active sponsorship opportunities
    const opportunities = await prisma.sponsorshipOpportunity.findMany({
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log(`Found ${opportunities.length} total opportunities`);

    // Filter opportunities to only include those with ACTIVE status (case insensitive)
    // and deadlines that haven't passed
    const now = new Date();
    const activeOpportunities = opportunities.filter((opportunity) => {
      const isActive = opportunity.status.toUpperCase() === "ACTIVE";
      const deadlineNotPassed =
        !opportunity.deadline || new Date(opportunity.deadline) > now;
      return isActive && deadlineNotPassed;
    });

    console.log(
      `Found ${activeOpportunities.length} active opportunities with valid deadlines`
    );

    // Return the filtered opportunities
    return res.status(200).json(activeOpportunities);
  } catch (error) {
    console.error("Error fetching sponsorship opportunities:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch sponsorship opportunities" });
  }
}
