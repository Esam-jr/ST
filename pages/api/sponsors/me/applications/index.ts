import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  // Check if user is authenticated
  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user is a sponsor
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true, role: true, name: true },
  });

  if (!user || user.role !== "SPONSOR") {
    return res.status(403).json({ message: "Forbidden - Not a sponsor" });
  }

  // Handle GET requests (list applications)
  if (req.method === "GET") {
    try {
      console.log(
        `Fetching sponsorship applications for sponsor ID: ${user.id}`
      );

      // Get applications for the current sponsor
      const applications = await prisma.sponsorshipApplication.findMany({
        where: {
          sponsorId: user.id,
        },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              startupCall: {
                select: {
                  id: true,
                  title: true,
                  industry: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(
        `Found ${applications.length} sponsorship applications for sponsor ID: ${user.id}`
      );

      // Return the applications
      return res.status(200).json(applications);
    } catch (error) {
      console.error("Error fetching sponsorship applications:", error);
      return res
        .status(500)
        .json({ message: "Error fetching sponsorship applications" });
    }
  }

  // Handle POST requests (create application)
  if (req.method === "POST") {
    try {
      const { opportunityId, amount, currency, message } = req.body;

      if (!opportunityId) {
        return res.status(400).json({ message: "Missing opportunityId" });
      }

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      // Find the opportunity
      const opportunity = await prisma.sponsorshipOpportunity.findUnique({
        where: { id: opportunityId },
        select: { deadline: true, status: true },
      });

      if (!opportunity) {
        return res
          .status(404)
          .json({ message: "Sponsorship opportunity not found" });
      }

      // Check if opportunity is still open for applications
      if (opportunity.status.toLowerCase() !== "open") {
        return res
          .status(400)
          .json({ message: "This opportunity is not open for applications" });
      }

      // Check if deadline has passed
      if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
        return res
          .status(400)
          .json({ message: "Application deadline has passed" });
      }

      // Check if the sponsor has already applied for this opportunity
      const existingApplication = await prisma.sponsorshipApplication.findFirst(
        {
          where: {
            sponsorId: user.id,
            opportunityId: opportunityId,
          },
        }
      );

      if (existingApplication) {
        return res
          .status(400)
          .json({ message: "You have already applied for this opportunity" });
      }

      console.log(
        `Creating new sponsorship application for sponsor ID: ${user.id}, opportunity ID: ${opportunityId}`
      );

      // Create the application with the minimal required fields based on our schema
      // Note: Adjust the field names based on your actual schema structure
      const application = await prisma.sponsorshipApplication.create({
        data: {
          sponsorId: user.id,
          opportunityId: opportunityId,
          amount: amount,
          currency: currency || "USD",
          status: "PENDING",
          // Add any other required fields from your schema:
          sponsorName: user.name || "Unknown",
          contactPerson: user.name || "Unknown",
          email: session.user.email || "unknown@example.com",
          sponsorshipType: "FINANCIAL",
          // Add the message if provided
          ...(message ? { message } : {}),
        },
      });

      console.log(`Created sponsorship application with ID: ${application.id}`);

      return res.status(201).json(application);
    } catch (error) {
      console.error("Error creating sponsorship application:", error);
      return res
        .status(500)
        .json({ message: "Error creating sponsorship application" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
