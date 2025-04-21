import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';
import { StartupCallStatus, StartupCallApplicationStatus } from '@prisma/client';

// Define enum for application status
enum ApplicationStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

// Define interface for application status mapping
interface ApplicationStatusMap {
  [callId: string]: string;
}

// Define interface for startup call from database
interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: string;
  applicationDeadline: Date;
  publishedDate: Date | null;
  industry: string;
  location: string;
  fundingAmount: string | null;
  requirements: string[];
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor: string | null;
  applicationProcess: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for call with application status
interface StartupCallWithStatus extends StartupCall {
  applicationStatus: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    // Use withPrisma wrapper to handle prepared statement errors with automatic retries
    const calls = await withPrisma(async () => {
      return prisma.startupCall.findMany({
        where: {
          // You can add additional filters based on query params
          // Example: status: req.query.status as StartupCallStatus
        },
        orderBy: {
          publishedDate: 'desc'
        },
        include: {
          // For each call, check if the user has applied
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

    // Transform the data to match the expected format
    const formattedCalls = calls.map(call => {
      // Check if the entrepreneur has applied to this call
      let applicationStatus = 'NOT_APPLIED';
      if (call.applications && call.applications.length > 0) {
        applicationStatus = call.applications[0].status;
      }

      return {
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
    });

    return res.status(200).json(formattedCalls);
  } catch (error) {
    console.error('Error fetching startup calls:', error);
    return res.status(500).json({ message: 'Error fetching startup calls', error: String(error) });
  }
} 