import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user is a reviewer
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    if (!user || user.role !== 'REVIEWER') {
      return res.status(403).json({ message: 'Only reviewers can access their assignments' });
    }

    // Use a raw query to avoid the Prisma schema issues
    const assignmentsQuery = `
      SELECT 
        ar.id, ar.status, ar."assignedAt", ar."dueDate", ar."completedAt",
        a.id as "applicationId", a."startupName", a.industry, a.stage, a.status as "applicationStatus", a."submittedAt",
        c.id as "callId", c.title as "callTitle"
      FROM "ApplicationReview" ar
      JOIN "StartupCallApplication" a ON ar."applicationId" = a.id
      JOIN "StartupCall" c ON a."callId" = c.id
      WHERE ar."reviewerId" = $1
      ORDER BY 
        CASE 
          WHEN ar.status = 'COMPLETED' THEN 3
          WHEN ar.status = 'OVERDUE' THEN 2
          WHEN ar.status = 'IN_PROGRESS' THEN 1
          ELSE 0
        END,
        ar."dueDate" ASC NULLS LAST
    `;

    const assignments = await withPrisma(() => 
      prisma.$queryRawUnsafe(assignmentsQuery, session.user.id)
    ) as any[];

    // Process assignments and update overdue status
    const now = new Date();
    const processedAssignments = await Promise.all(assignments.map(async (assignment) => {
      let status = assignment.status;
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      
      // Set status to OVERDUE if past due date and not completed
      if (dueDate && dueDate < now && status !== 'COMPLETED' && status !== 'OVERDUE') {
        status = 'OVERDUE';
        // Update the status in the database
        await withPrisma(() => 
          prisma.$executeRawUnsafe(
            `UPDATE "ApplicationReview" SET status = 'OVERDUE' WHERE id = $1`,
            assignment.id
          )
        );
      }

      // Format the output to match the expected client structure
      return {
        id: assignment.id,
        status: status,
        assignedAt: assignment.assignedAt,
        dueDate: assignment.dueDate,
        completedAt: assignment.completedAt,
        application: {
          id: assignment.applicationId,
          startupName: assignment.startupName,
          industry: assignment.industry,
          stage: assignment.stage,
          status: assignment.applicationStatus,
          submittedAt: assignment.submittedAt,
          call: {
            id: assignment.callId,
            title: assignment.callTitle
          }
        }
      };
    }));

    return res.status(200).json(processedAssignments);
    
  } catch (error) {
    console.error('Error fetching review assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 