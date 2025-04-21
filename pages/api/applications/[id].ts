import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { StartupCallApplicationStatus } from '@prisma/client';

// Type definitions
type ApplicationStatus = StartupCallApplicationStatus;

interface StartupCallApplication {
  id: string;
  callId: string;
  callTitle: string;
  submittedAt: string;
  status: ApplicationStatus;
  
  // Startup information
  startupName: string;
  website?: string;
  foundingDate: string;
  teamSize: string;
  industry: string;
  stage: string;
  description: string;
  
  // Application details
  problem: string;
  solution: string;
  traction?: string;
  businessModel: string;
  funding?: string;
  useOfFunds: string;
  competitiveAdvantage: string;
  founderBio: string;
  
  // Files
  pitchDeckUrl?: string;
  financialsUrl?: string;
  
  // Review information
  reviewsCompleted: number;
  reviewsTotal: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the application ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Missing application ID' });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is an entrepreneur
    if (session.user.role !== 'ENTREPRENEUR') {
      return res.status(403).json({ message: 'Forbidden - Only entrepreneurs can view their applications' });
    }

    // Fetch the application from the database
    const application = await prisma.startupCallApplication.findUnique({
      where: {
        id: id,
        userId: session.user.id // Ensure the application belongs to the current user
      },
      include: {
        call: {
          select: {
            id: true,
            title: true,
            description: true,
            applicationDeadline: true,
            industry: true,
            location: true,
            fundingAmount: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Format the response to match the expected structure
    const formattedApplication = {
      id: application.id,
      callId: application.callId,
      callTitle: application.call.title,
      submittedAt: application.submittedAt.toISOString(),
      status: application.status,
      // Startup information
      startupName: application.startupName,
      website: application.website || "",
      foundingDate: application.foundingDate.toISOString(),
      teamSize: application.teamSize,
      industry: application.industry,
      stage: application.stage,
      description: application.description,
      
      // Application details
      problem: application.problem,
      solution: application.solution,
      traction: application.traction || "",
      businessModel: application.businessModel,
      funding: application.funding || "",
      useOfFunds: application.useOfFunds,
      competitiveAdvantage: application.competitiveAdvantage,
      founderBio: application.founderBio,
      
      // Files
      pitchDeckUrl: application.pitchDeckUrl || "",
      financialsUrl: application.financialsUrl || undefined,
      
      // Review information
      reviewsCompleted: application.reviewsCompleted,
      reviewsTotal: application.reviewsTotal
    };

    return res.status(200).json(formattedApplication);
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 