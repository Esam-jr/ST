import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
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

  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    // Fetch the startup call
    const call = await prisma.startupCall.findUnique({
      where: {
        id: id
      },
      include: {
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
      applicationStatus: userId && userRole === 'ENTREPRENEUR' ? applicationStatus : undefined
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