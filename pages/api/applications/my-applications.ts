import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user has the ENTREPRENEUR role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ENTREPRENEUR") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these applications" });
    }

    // Fetch applications for the authenticated entrepreneur
    const applications = await prisma.startupCallApplication.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        startupName: true,
        industry: true,
        stage: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        reviewsCompleted: true,
        reviewsTotal: true,
        call: {
          select: {
            id: true,
            title: true,
            status: true,
            applicationDeadline: true,
            industry: true,
            location: true,
            fundingAmount: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Format the response to match expected structure
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      startupName: app.startupName,
      industry: app.industry,
      stage: app.stage,
      status: app.status,
      submittedAt: app.submittedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      reviewsCompleted: app.reviewsCompleted,
      reviewsTotal: app.reviewsTotal,
      call: app.call,
    }));

    return res.status(200).json(formattedApplications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
