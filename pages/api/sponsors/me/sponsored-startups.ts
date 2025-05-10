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

  // Only sponsors can access this endpoint
  if (session.user.role !== "SPONSOR") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only sponsors can access this endpoint" });
  }

  try {
    // Get all approved sponsorship applications for the current sponsor
    const sponsorApplications = await prisma.sponsorshipApplication.findMany({
      where: {
        sponsorId: session.user.id,
        status: "APPROVED", // Only include approved applications
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            startupCallId: true,
            startupCall: {
              select: {
                id: true,
                title: true,
                applications: {
                  where: {
                    status: "SELECTED", // Use the correct status for winners
                  },
                  select: {
                    id: true,
                    startupName: true,
                    startupId: true,
                    website: true,
                    industry: true,
                    stage: true,
                    description: true,
                    foundingDate: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                      },
                    },
                    startup: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                        website: true,
                        industry: true,
                      },
                    },
                  },
                  take: 1, // Only get the winner
                },
              },
            },
          },
        },
      },
    });

    // Extract the sponsored startups from the applications
    const sponsoredStartups = sponsorApplications
      .filter(
        (app) =>
          app.opportunity.startupCall &&
          app.opportunity.startupCall.applications.length > 0
      )
      .map((app) => {
        const winnerApplication = app.opportunity.startupCall.applications[0];
        const startupCall = app.opportunity.startupCall;

        return {
          sponsorshipApplicationId: app.id,
          sponsorshipAmount: app.amount,
          sponsorshipCurrency: app.currency,
          sponsorshipStatus: app.status,
          opportunityId: app.opportunity.id,
          opportunityTitle: app.opportunity.title,
          startupCallId: startupCall.id,
          startupCallTitle: startupCall.title,
          applicationId: winnerApplication.id,
          startupId: winnerApplication.startupId,
          startupName: winnerApplication.startupName,
          website: winnerApplication.website,
          industry: winnerApplication.industry,
          stage: winnerApplication.stage,
          description: winnerApplication.description,
          founderDetails: winnerApplication.user,
          startupDetails: winnerApplication.startup,
        };
      });

    return res.status(200).json(sponsoredStartups);
  } catch (error) {
    console.error("Error fetching sponsored startups:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch sponsored startups" });
  }
}
