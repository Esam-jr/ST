import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import withPrisma from "@/lib/prisma-wrapper";

type ReviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WITHDRAWN";

interface FormattedAssignment {
  id: string;
  status: ReviewStatus;
  assignedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  application: {
    id: string;
    startupName: string;
    industry: string;
    stage: string;
    status: string;
    submittedAt: string;
    call: {
      id: string;
      title: string;
    };
  };
}

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

    // Get all review assignments for the reviewer
    const assignments = await prisma.applicationReview.findMany({
      where: {
        reviewerId: session.user.id,
      },
      include: {
        application: {
          select: {
            id: true,
            startupName: true,
            industry: true,
            stage: true,
            status: true,
            submittedAt: true,
            call: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          dueDate: "asc",
        },
      ],
    });

    // Format the response
    const formattedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      dueDate: assignment.dueDate,
      completedAt: assignment.completedAt,
      application: {
        id: assignment.application.id,
        startupName: assignment.application.startupName,
        industry: assignment.application.industry,
        stage: assignment.application.stage,
        status: assignment.application.status,
        submittedAt: assignment.application.submittedAt,
        call: {
          id: assignment.application.call.id,
          title: assignment.application.call.title,
        },
      },
    }));

    return res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error("Error fetching review assignments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
