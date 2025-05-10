import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import withPrisma from "@/lib/prisma-wrapper";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this endpoint
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if the user is a reviewer
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
      })
    );

    if (!user || user.role !== "REVIEWER") {
      return res
        .status(403)
        .json({ message: "Only reviewers can access their assignments" });
    }

    // Get review ID from route
    const { id } = req.query;
    const reviewId = Array.isArray(id) ? id[0] : id;

    // Fetch the review with complete application data
    const review = await withPrisma(() =>
      prisma.applicationReview.findUnique({
        where: { id: reviewId },
        include: {
          application: {
            include: {
              call: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      })
    );

    if (!review) {
      return res.status(404).json({ message: "Review assignment not found" });
    }

    // Check if the review belongs to the current reviewer
    if (review.reviewerId !== session.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to access this review" });
    }

    // Format the response
    const formattedReview = {
      id: review.id,
      status: review.status,
      assignedAt: review.assignedAt,
      dueDate: review.dueDate,
      completedAt: review.completedAt,
      score: review.score,
      innovationScore: review.innovationScore,
      marketScore: review.marketScore,
      teamScore: review.teamScore,
      executionScore: review.executionScore,
      feedback: review.feedback,
      application: {
        id: review.application.id,
        startupName: review.application.startupName,
        industry: review.application.industry,
        stage: review.application.stage,
        status: review.application.status,
        submittedAt: review.application.submittedAt,
        call: {
          id: review.application.call.id,
          title: review.application.call.title,
        },
      },
    };

    return res.status(200).json(formattedReview);
  } catch (error) {
    console.error("Error fetching review assignment:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
