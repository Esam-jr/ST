import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only sponsors can access their own applications
  if (session.user.role !== "SPONSOR") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only sponsors can access this endpoint" });
  }

  try {
    // Extract query parameters for filtering
    const { status } = req.query;

    // Build the filter
    const filter: any = {
      sponsorId: session.user.id,
    };

    // Filter by status if provided
    if (status) {
      filter.status = status as string;
    }

    // Get all applications for the logged-in sponsor
    const applications = await prisma.sponsorshipApplication.findMany({
      where: filter,
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            description: true,
            minAmount: true,
            maxAmount: true,
            currency: true,
            status: true,
            benefits: true,
            deadline: true,
            startupCallId: true,
            startupCall: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching sponsor applications:", error);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
}
