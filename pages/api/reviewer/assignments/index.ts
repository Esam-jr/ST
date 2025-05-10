import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if the user is a reviewer
    if (session.user.role !== "REVIEWER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const assignments = await prisma.$queryRaw`
      SELECT 
        ra.id, ra.status, ra."assignedAt", ra."dueDate", ra."completedAt",
        a.id as "applicationId", a."startupName", a.industry, a.stage, a.status as "applicationStatus", a."submittedAt",
        c.id as "callId", c.title as "callTitle"
      FROM "ReviewAssignment" ra
      JOIN "StartupCallApplication" a ON ra."applicationId" = a.id
      JOIN "StartupCall" c ON a."callId" = c.id
      WHERE ra."reviewerId" = ${session.user.id}
      ORDER BY ra."assignedAt" DESC
    `;

    const formattedAssignments: FormattedAssignment[] = (
      assignments as any[]
    ).map((assignment) => ({
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt.toISOString(),
      dueDate: assignment.dueDate?.toISOString() || null,
      completedAt: assignment.completedAt?.toISOString() || null,
      application: {
        id: assignment.applicationId,
        startupName: assignment.startupName,
        industry: assignment.industry,
        stage: assignment.stage,
        status: assignment.applicationStatus,
        submittedAt: assignment.submittedAt.toISOString(),
        call: {
          id: assignment.callId,
          title: assignment.callTitle,
        },
      },
    }));

    return res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error("Error fetching reviewer assignments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
