import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';
import { StartupCallStatus, StartupCallApplicationStatus } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the call ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid startup call ID' });
  }

  // Get the user's session
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  // For write operations, only allow ADMIN users
  if ((req.method === 'PUT' || req.method === 'DELETE') && userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      // Fetch the startup call
      const call = await withPrisma(async () => {
        return prisma.startupCall.findUnique({
          where: {
            id: id
          },
          include: {
            // Include application count
            _count: {
              select: {
                applications: true
              }
            },
            // Check if the user has applied to this call
            applications: userId && userRole === 'ENTREPRENEUR' ? {
              where: {
                userId: userId
              },
              select: {
                id: true,
                status: true
              }
            } : false
          }
        });
      });

      if (!call) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      // Check if the entrepreneur has applied to this call
      let applicationStatus = 'NOT_APPLIED';
      if (call.applications && call.applications.length > 0) {
        applicationStatus = call.applications[0].status;
      }

      // Format the response
      const formattedCall = {
        id: call.id,
        title: call.title,
        description: call.description,
        status: call.status,
        applicationDeadline: call.applicationDeadline.toISOString(),
        publishedDate: call.publishedDate ? call.publishedDate.toISOString() : null,
        industry: call.industry,
        location: call.location,
        fundingAmount: call.fundingAmount,
        requirements: call.requirements,
        eligibilityCriteria: call.eligibilityCriteria,
        selectionProcess: call.selectionProcess,
        aboutSponsor: call.aboutSponsor,
        applicationProcess: call.applicationProcess,
        applicationStatus: userId && userRole === 'ENTREPRENEUR' ? applicationStatus : undefined,
        _count: call._count
      };

      return res.status(200).json(formattedCall);
    } catch (error) {
      console.error(`Error fetching startup call with ID ${id}:`, error);
      return res.status(500).json({ 
        message: 'Error fetching startup call details',
        error: String(error)
      });
    }
  }

  // Handle PUT request (update)
  if (req.method === 'PUT') {
    try {
      // Check if the call exists
      const existingCall = await withPrisma(async () => {
        return prisma.startupCall.findUnique({
          where: { id }
        });
      });

      if (!existingCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      const {
        title,
        description,
        status,
        applicationDeadline,
        publishedDate,
        industry,
        location,
        fundingAmount,
        requirements,
        eligibilityCriteria,
        selectionProcess,
        aboutSponsor,
        applicationProcess,
      } = req.body;

      // Validate required fields
      if (!title || !description || !applicationDeadline || !industry || !location) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // If status is changing to PUBLISHED, set publishedDate if not already set
      let updatedPublishedDate = publishedDate;
      if (status === 'PUBLISHED' && existingCall.status !== 'PUBLISHED' && !publishedDate) {
        updatedPublishedDate = new Date().toISOString();
      }

      // Update the startup call
      const updatedCall = await withPrisma(async () => {
        return prisma.startupCall.update({
          where: { id },
          data: {
            title,
            description,
            status: status as StartupCallStatus,
            applicationDeadline: new Date(applicationDeadline),
            publishedDate: updatedPublishedDate ? new Date(updatedPublishedDate) : null,
            industry,
            location,
            fundingAmount,
            requirements: Array.isArray(requirements) ? requirements : existingCall.requirements,
            eligibilityCriteria: Array.isArray(eligibilityCriteria) ? eligibilityCriteria : existingCall.eligibilityCriteria,
            selectionProcess: Array.isArray(selectionProcess) ? selectionProcess : existingCall.selectionProcess,
            aboutSponsor,
            applicationProcess,
          }
        });
      });

      return res.status(200).json(updatedCall);
    } catch (error) {
      console.error(`Error updating startup call with ID ${id}:`, error);
      return res.status(500).json({
        message: 'Error updating startup call',
        error: String(error)
      });
    }
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // First, check if there are any applications for this call
      const applicationCount = await withPrisma(async () => {
        return prisma.startupCallApplication.count({
          where: { callId: id }
        });
      });

      // If there are applications, don't allow deletion
      if (applicationCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete startup call with existing applications. Consider archiving it instead.' 
        });
      }

      // Delete the startup call
      await withPrisma(async () => {
        return prisma.startupCall.delete({
          where: { id }
        });
      });

      return res.status(200).json({ message: 'Startup call deleted successfully' });
    } catch (error) {
      console.error(`Error deleting startup call with ID ${id}:`, error);
      return res.status(500).json({
        message: 'Error deleting startup call',
        error: String(error)
      });
    }
  }

  // If we reach here, the method is not supported
  return res.status(405).json({ message: 'Method not allowed' });
} 