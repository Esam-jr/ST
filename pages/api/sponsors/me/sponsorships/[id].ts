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

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing sponsorship ID" });
  }

  try {
    console.log(
      `Fetching sponsorship with ID: ${id} for sponsor ID: ${user.id}`
    );

    // Get sponsorship by ID and verify it belongs to the current sponsor
    const sponsorship = await prisma.sponsorship.findUnique({
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
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        startupFounder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sponsorship) {
      console.log(`No sponsorship found with ID: ${id}`);
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    // Verify the sponsorship belongs to the current sponsor
    if (sponsorship.sponsorId !== user.id) {
      console.log(
        `Sponsorship ID: ${id} does not belong to sponsor ID: ${user.id}`
      );
      return res
        .status(403)
        .json({
          message: "Forbidden - Not authorized to access this sponsorship",
        });
    }

    console.log(`Found sponsorship with ID: ${id} for sponsor ID: ${user.id}`);

    // Return the sponsorship
    return res.status(200).json(sponsorship);
  } catch (error) {
    console.error("Error fetching sponsorship:", error);
    return res.status(500).json({ message: "Error fetching sponsorship" });
  }
}
