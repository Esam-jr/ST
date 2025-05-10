import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { type, userId, data } = req.body;

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        userId,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    // If it's a startup winner notification, also send an email
    if (type === "STARTUP_WINNER") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        // Send email notification
        // This would be implemented with your email service
        console.log(`Sending email to ${user.email} about winning startup`);
      }
    }

    return res.status(200).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
