import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: { role: true },
  });

  // Check if user has admin role
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { id } = req.query;

  // Handle DELETE request
  if (req.method === "DELETE") {
    try {
      // Check if advertisement exists
      const existingAd = await prisma.advertisement.findUnique({
        where: { id: String(id) },
      });

      if (!existingAd) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      // Delete advertisement
      await prisma.advertisement.delete({
        where: { id: String(id) },
      });

      // Return success response
      return res
        .status(200)
        .json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      return res.status(500).json({ error: "Failed to delete advertisement" });
    }
  }

  // Handle PUT request (full update)
  if (req.method === "PUT") {
    const { title, content, imageUrl, scheduledDate, platforms, status } =
      req.body;

    // Validate required fields
    if (!title || !content || !scheduledDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Check if advertisement exists
      const existingAd = await prisma.advertisement.findUnique({
        where: { id: String(id) },
      });

      if (!existingAd) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      // Update advertisement
      const updatedAd = await prisma.advertisement.update({
        where: { id: String(id) },
        data: {
          title,
          content,
          imageUrl,
          scheduledDate: new Date(scheduledDate),
          platforms: platforms || [],
          status: status || existingAd.status,
        },
      });

      return res.status(200).json(updatedAd);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      return res.status(500).json({ error: "Failed to update advertisement" });
    }
  }

  // Handle PATCH request (partial update, typically for status change)
  if (req.method === "PATCH") {
    try {
      // Check if advertisement exists
      const existingAd = await prisma.advertisement.findUnique({
        where: { id: String(id) },
      });

      if (!existingAd) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      // Update only provided fields
      const updatedAd = await prisma.advertisement.update({
        where: { id: String(id) },
        data: req.body,
      });

      return res.status(200).json(updatedAd);
    } catch (error) {
      console.error("Error updating advertisement status:", error);
      return res
        .status(500)
        .json({ error: "Failed to update advertisement status" });
    }
  }

  // Return method not allowed for other HTTP methods
  return res.status(405).json({ error: "Method not allowed" });
}
