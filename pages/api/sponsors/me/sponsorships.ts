import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
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

  // Only sponsors can access their own sponsorships
  if (session.user.role !== "SPONSOR") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only sponsors can access this endpoint" });
  }

  try {
    // Get all sponsorships for the logged-in sponsor
    const sponsorships = await prisma.sponsorship.findMany({
      where: {
        sponsorId: session.user.id,
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            stage: true,
          },
        },
        // Include startup call if available
        startupCall: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return res.status(200).json(sponsorships);
  } catch (error) {
    console.error("Error fetching sponsor sponsorships:", error);
    return res.status(500).json({ error: "Failed to fetch sponsorships" });
  }
}
