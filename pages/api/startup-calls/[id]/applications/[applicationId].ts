import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, applicationId } = req.query;
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Check if ids are valid
  if (!id || typeof id !== 'string' || !applicationId || typeof applicationId !== 'string') {
    return res.status(400).json({ message: 'Invalid startup call or application ID' });
  }

  // GET /api/startup-calls/:id/applications/:applicationId - Get application details
  if (req.method === 'GET') {
    try {
      // Fetch the application with related data
      const application = await prisma.startupCallApplication.findFirst({
        where: {
          id: applicationId,
          callId: id
        },
        include: {
          call: {
            select: {
              id: true,
              title: true,
              status: true,
              industry: true,
              applicationDeadline: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          startup: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check permissions - Admins can view any application, entrepreneurs can only view their own
      if (session.user.role !== 'ADMIN' && application.userId !== session.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this application' });
      }

      return res.status(200).json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      return res.status(500).json({ message: 'Error fetching application' });
    }
  }

  // PUT /api/startup-calls/:id/applications/:applicationId - Update application status
  if (req.method === 'PUT') {
    // Only admins can update application status
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can update application status' });
    }

    try {
      const { status, reviewsCompleted, reviewsTotal } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // Update application
      const updatedApplication = await prisma.startupCallApplication.update({
        where: {
          id: applicationId
        },
        data: {
          status,
          ...(reviewsCompleted !== undefined && { reviewsCompleted }),
          ...(reviewsTotal !== undefined && { reviewsTotal })
        }
      });

      return res.status(200).json(updatedApplication);
    } catch (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ message: 'Error updating application' });
    }
  }

  // Return 405 Method Not Allowed for other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 