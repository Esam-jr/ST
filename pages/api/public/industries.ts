import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Fetching industries from startup calls");

    // Get all industries from startup calls
    const startupCalls = await prisma.startupCall.findMany({
      where: {
        industry: {
          not: "",
        },
      },
      select: {
        industry: true,
      },
      distinct: ["industry"],
    });

    // Extract unique industries and filter out empty or null values
    const industries = startupCalls
      .map((call) => call.industry)
      .filter(Boolean) // Remove null, undefined, or empty strings
      .sort();

    console.log(`Found ${industries.length} unique industries`);

    return res.status(200).json(industries);
  } catch (error) {
    console.error("Error fetching industries:", error);
    return res.status(500).json({ message: "Error fetching industries" });
  }
}
