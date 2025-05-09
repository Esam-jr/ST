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
    console.log("Fetching public sponsorship opportunities");

    // Get all available sponsorship opportunities
    const opportunities = await prisma.sponsorshipOpportunity.findMany({
      where: {
        status: "OPEN",
        // Only include opportunities where the deadline hasn't passed
        OR: [{ deadline: null }, { deadline: { gt: new Date() } }],
      },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
            industry: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `Found ${opportunities.length} active sponsorship opportunities`
    );

    // Return the opportunities
    return res.status(200).json(opportunities);
  } catch (error) {
    console.error("Error fetching sponsorship opportunities:", error);
    return res
      .status(500)
      .json({ message: "Error fetching sponsorship opportunities" });
  }
}
