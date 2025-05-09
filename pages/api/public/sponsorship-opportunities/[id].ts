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
    description: string;
    industry: string;
    logo: string;
    companyName: string;
    website: string;
    contactEmail: string;
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
    return res.status(400).json({ message: "Missing opportunity ID" });
  }

  try {
    console.log(`Fetching sponsorship opportunity with ID: ${id}`);

    // Get the sponsorship opportunity by ID
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: {
        id: id,
      },
      include: {
        startupCall: {
          select: {
            id: true,
            title: true,
            description: true,
            industry: true,
          },
        },
      },
    });

    if (!opportunity) {
      console.log(`No opportunity found with ID: ${id}`);
      return res
        .status(404)
        .json({ message: "Sponsorship opportunity not found" });
    }

    console.log(`Found opportunity: ${opportunity.title}`);

    // Only allow active opportunities to be viewed publicly (case insensitive)
    if (opportunity.status.toUpperCase() !== "ACTIVE") {
      return res
        .status(403)
        .json({ message: "This opportunity is not currently available" });
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
      .json({ message: "Error fetching sponsorship opportunity" });
  }
}
