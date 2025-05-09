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
    select: { id: true, role: true },
  });

  if (!user || user.role !== "SPONSOR") {
    return res.status(403).json({ message: "Forbidden - Not a sponsor" });
  }

  try {
    console.log(`Fetching sponsorship applications for sponsor ID: ${user.id}`);

    // Get applications for the current sponsor
    const applications = await prisma.sponsorshipApplication.findMany({
      where: {
        sponsorId: user.id,
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
