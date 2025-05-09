import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

/**
 * IMPORTANT: This endpoint is deprecated.
 * Please use /api/startup-calls directly with the appropriate filters.
 * This endpoint now simply redirects to maintain backward compatibility
 * but will be removed in a future update.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this public endpoint
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get only published startup calls
    const publishedCalls = await prisma.startupCall.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        publishedDate: "desc",
      },
    });

    // Add deprecation notice in response headers
    res.setHeader(
      "X-Deprecation-Notice",
      "This endpoint is deprecated. Please use /api/startup-calls directly."
    );

    return res.status(200).json(publishedCalls);
  } catch (error) {
    console.error("Error fetching public startup calls:", error);
    return res.status(500).json({ message: "Error fetching startup calls" });
  }
}
