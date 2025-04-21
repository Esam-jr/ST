import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is a reviewer
    const user = await withPrisma(() => 
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    );

    if (!user || user.role !== 'REVIEWER') {
      return res.status(403).json({ message: 'Not authorized to view review assignments' });
    }

    // Fetch all review assignments for the reviewer
    const assignments = await withPrisma(() => 
      prisma.applicationReview.findMany({
        where: { reviewerId: session.user.id },
        select: {
          id: true,
          status: true,
          assignedAt: true,
          dueDate: true,
          completedAt: true,
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
                }
              }
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' }
        ],
      })
    );

    // Check for overdue assignments and update their status
    const now = new Date();
    const updatedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        if (
          assignment.status !== 'COMPLETED' && 
          assignment.dueDate && 
          new Date(assignment.dueDate) < now
        ) {
          // Update the assignment status to OVERDUE
          const updatedAssignment = await withPrisma(() =>
            prisma.applicationReview.update({
              where: { id: assignment.id },
              data: { status: 'OVERDUE' },
              select: {
                id: true,
                status: true,
                assignedAt: true,
                dueDate: true,
                completedAt: true,
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
                      }
                    }
                  }
                }
              }
            })
          );
          return updatedAssignment;
        }
        return assignment;
      })
    );

    return res.status(200).json(updatedAssignments);
    
  } catch (error) {
    console.error('Error fetching review assignments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 