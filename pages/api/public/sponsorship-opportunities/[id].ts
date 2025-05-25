import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  const { id } = req.query;

  // Check if the ID is valid
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid opportunity ID" });
  }

  try {
    // Fetch the opportunity
    const opportunity = (await prisma.sponsorshipOpportunity.findUnique({
      where: { id },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })) as SponsorshipOpportunity | null;

    if (!opportunity) {
      return res
        .status(404)
        .json({ message: "Sponsorship opportunity not found" });
    }

    // Only allow active opportunities to be viewed publicly (case insensitive)
    if (opportunity.status.toUpperCase() !== "OPEN") {
      return res
        .status(403)
        .json({ message: "This opportunity is not currently accepting applications" });
    }

    // Check if deadline has passed
    if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
      return res
        .status(403)
        .json({ message: "The deadline for this opportunity has passed" });
    }

    // Return the opportunity
    return res.status(200).json(opportunity);
  } catch (error) {
    console.error("Error fetching sponsorship opportunity:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch sponsorship opportunity" });
  }
}
