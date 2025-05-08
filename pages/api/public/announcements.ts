import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Add caching headers to improve performance
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      );

      // Get current date
      const now = new Date();

      // Get advertisements that are published and scheduled for now or earlier
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
        select: {
          id: true,
          title: true,
          content: true,
          imageUrl: true,
          scheduledDate: true,
          platforms: true,
          createdAt: true,
        },
      });

      return res.status(200).json(advertisements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return res.status(500).json({ error: "Failed to fetch announcements" });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ error: "Method not allowed" });
}
