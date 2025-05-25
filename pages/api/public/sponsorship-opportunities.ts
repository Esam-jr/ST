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
      where: {
        status: "OPEN",
        visibility: "PUBLIC",
        OR: [
          { deadline: null },
          { deadline: { gt: new Date() } }
        ]
      },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return the opportunities
    return res.status(200).json(opportunities);
  } catch (error) {
    console.error("Error fetching sponsorship opportunities:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch sponsorship opportunities" });
  }
}
