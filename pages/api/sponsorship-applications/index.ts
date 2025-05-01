import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSponsorshipApplications(req, res, session);
    case 'POST':
      return createSponsorshipApplication(req, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get sponsorship applications
async function getSponsorshipApplications(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Extract query parameters
    const { opportunityId, status } = req.query;
    
    // Build filter
    const filter: any = {};
    
    // Filter by opportunity ID if provided
    if (opportunityId) {
      filter.opportunityId = opportunityId as string;
    }
    
    // Filter by status if provided
    if (status) {
      filter.status = status as string;
    }
    
    // Admins can see all applications, sponsors can only see their own
    if (session.user.role === 'ADMIN') {
      // Admins get all applications matching the filter
      const applications = await prisma.sponsorshipApplication.findMany({
        where: filter,
        include: {
          opportunity: {
            select: {
              title: true,
              minAmount: true,
              maxAmount: true,
              currency: true,
              startupCallId: true,
              startupCall: {
                select: {
                  title: true,
                },
              },
            },
          },
          sponsor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return res.status(200).json(applications);
    } else if (session.user.role === 'SPONSOR') {
      // Sponsors can only see their own applications
      filter.sponsorId = session.user.id;
      
      const applications = await prisma.sponsorshipApplication.findMany({
        where: filter,
        include: {
          opportunity: {
            select: {
              title: true,
              minAmount: true,
              maxAmount: true,
              currency: true,
              description: true,
              benefits: true,
              startupCallId: true,
              startupCall: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return res.status(200).json(applications);
    } else {
      // Other roles don't have access
      return res.status(403).json({ error: 'Forbidden: Access denied to sponsorship applications' });
    }
  } catch (error) {
    console.error('Error fetching sponsorship applications:', error);
    return res.status(500).json({ error: 'Failed to fetch sponsorship applications' });
  }
}

// Create a new sponsorship application
async function createSponsorshipApplication(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Only sponsors can apply for sponsorship opportunities
    if (session.user.role !== 'SPONSOR') {
      return res.status(403).json({ error: 'Forbidden: Only sponsors can apply for sponsorship opportunities' });
    }

    const { opportunityId, amount, currency, message } = req.body;

    // Basic validation
    if (!opportunityId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the opportunity exists and is active
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Sponsorship opportunity not found' });
    }

    if (opportunity.status !== 'active') {
      return res.status(400).json({ error: 'This sponsorship opportunity is not currently accepting applications' });
    }

    // Check if amount is within the valid range
    if (amount < opportunity.minAmount || amount > opportunity.maxAmount) {
      return res.status(400).json({ 
        error: `Amount must be between ${opportunity.minAmount} and ${opportunity.maxAmount} ${opportunity.currency}` 
      });
    }

    // Check if the sponsor has already applied for this opportunity
    const existingApplication = await prisma.sponsorshipApplication.findFirst({
      where: {
        opportunityId,
        sponsorId: session.user.id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this sponsorship opportunity' });
    }

    // Create the application
    const application = await prisma.sponsorshipApplication.create({
      data: {
        opportunityId,
        sponsorId: session.user.id,
        amount: Number(amount),
        currency,
        message: message || null,
        status: 'pending', // Default status for new applications
      },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error('Error creating sponsorship application:', error);
    return res.status(500).json({ error: 'Failed to create sponsorship application' });
  }
} 