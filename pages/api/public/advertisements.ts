import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Add caching headers to improve performance
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );

    // Get current date
    const now = new Date();

    // Fetch all published advertisements scheduled for now or earlier
    const advertisements = await prisma.advertisement.findMany({
      where: {
        status: "published",
        scheduledDate: {
          lte: now, // Less than or equal to now (current or past)
        },
      },
      orderBy: {
        scheduledDate: "desc",
      },
      // Include only needed fields to optimize response
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        scheduledDate: true,
        platforms: true,
        status: true,
      },
    });

    return res.status(200).json(advertisements);
  } catch (error) {
    console.error("Error fetching public advertisements:", error);
    return res.status(500).json({ error: "Failed to fetch advertisements" });
  }
}
