import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const session = await getServerSession(req, res, authOptions);

  // Check if id is valid
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid startup call ID' });
  }

  // GET /api/startup-calls/:id - Get a specific startup call
  if (req.method === 'GET') {
    try {
      const startupCall = await prisma.startupCall.findUnique({
        where: { id }
      });

      if (!startupCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      // For non-authenticated users or non-admins, only published and closed calls are visible
      if ((!session || session.user.role !== 'ADMIN') && 
          startupCall.status !== 'PUBLISHED' && 
          startupCall.status !== 'CLOSED') {
        return res.status(403).json({ message: 'Not authorized to view this startup call' });
      }

      // For entrepreneurs, include application status
      if (session?.user?.role === 'ENTREPRENEUR') {
        const application = await prisma.startupCallApplication.findFirst({
          where: {
            callId: id,
            userId: session.user.id
          }
        });

        return res.status(200).json({
          ...startupCall,
          applicationStatus: application ? application.status : 'NOT_APPLIED'
        });
      }

      // Return the startup call
      return res.status(200).json(startupCall);
    } catch (error) {
      console.error('Error fetching startup call:', error);
      return res.status(500).json({ message: 'Error fetching startup call' });
    }
  }

  // PUT /api/startup-calls/:id - Update a startup call
  if (req.method === 'PUT') {
    // Only administrators can update startup calls
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update startup calls' });
    }

    try {
      const {
        title,
        description,
        applicationDeadline,
        industry,
        location,
        fundingAmount,
        requirements,
        eligibilityCriteria,
        selectionProcess,
        aboutSponsor,
        applicationProcess,
        status
      } = req.body;

      // Basic validation
      if (!title || !description || !applicationDeadline || !industry || !location) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if the call exists
      const existingCall = await prisma.startupCall.findUnique({
        where: { id }
      });

      if (!existingCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      // Update publishedDate if status is changing to PUBLISHED
      const wasPublished = existingCall.status === 'PUBLISHED';
      const isBeingPublished = status === 'PUBLISHED' && !wasPublished;
      
      // Update startup call
      const updatedStartupCall = await prisma.startupCall.update({
        where: { id },
        data: {
          title,
          description,
          applicationDeadline: new Date(applicationDeadline),
          publishedDate: isBeingPublished ? new Date() : existingCall.publishedDate,
          industry,
          location,
          fundingAmount,
          requirements: requirements || [],
          eligibilityCriteria: eligibilityCriteria || [],
          selectionProcess: selectionProcess || [],
          aboutSponsor,
          applicationProcess,
          status: status || existingCall.status
        }
      });

      return res.status(200).json(updatedStartupCall);
    } catch (error) {
      console.error('Error updating startup call:', error);
      return res.status(500).json({ message: 'Error updating startup call' });
    }
  }

  // DELETE /api/startup-calls/:id - Delete a startup call
  if (req.method === 'DELETE') {
    // Only administrators can delete startup calls
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete startup calls' });
    }

    try {
      // Check if the call exists
      const existingCall = await prisma.startupCall.findUnique({
        where: { id },
        include: {
          _count: {
            select: { applications: true }
          }
        }
      });

      if (!existingCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      // If there are applications, don't allow deletion
      if (existingCall._count.applications > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete startup call with existing applications. Archive it instead.' 
        });
      }

      // Delete the startup call
      await prisma.startupCall.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Startup call deleted successfully' });
    } catch (error) {
      console.error('Error deleting startup call:', error);
      return res.status(500).json({ message: 'Error deleting startup call' });
    }
  }

  // Return 405 Method Not Allowed for other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 