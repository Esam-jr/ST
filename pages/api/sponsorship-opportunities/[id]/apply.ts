import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has the SPONSOR role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'SPONSOR') {
      return res.status(403).json({ message: 'Not authorized to submit applications' });
    }

    const { id } = req.query;
    const {
      amount,
      message,
      sponsorName,
      contactPerson,
      email,
      phone,
      website,
      sponsorshipType,
      otherType,
    } = req.body;

    // Validate the opportunity exists and is open
    const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        status: true,
        deadline: true,
        minAmount: true,
        maxAmount: true,
        title: true,
      }
    });

    // Debug log the opportunity details
    console.log('Opportunity found:', {
      id: opportunity?.id,
      status: opportunity?.status,
      statusType: opportunity?.status ? typeof opportunity.status : 'undefined',
      deadline: opportunity?.deadline,
    });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Check if opportunity is open for applications
    // Update status check to be case-insensitive and handle different status values
    if (opportunity.status !== 'OPEN' && 
        opportunity.status !== 'ACTIVE' && 
        opportunity.status.toUpperCase() !== 'OPEN' && 
        opportunity.status.toUpperCase() !== 'ACTIVE') {
      return res.status(400).json({ 
        message: 'This opportunity is not open for applications',
        currentStatus: opportunity.status 
      });
    }

    // Log the opportunity status for debugging
    console.log(`Opportunity status: ${opportunity.status}`);

    if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
      return res.status(400).json({ message: 'The application deadline has passed' });
    }

    // Validate amount is within range
    if (amount < opportunity.minAmount || amount > opportunity.maxAmount) {
      return res.status(400).json({
        message: `Amount must be between ${opportunity.minAmount} and ${opportunity.maxAmount}`
      });
    }

    // Check if user has already applied
    const existingApplication = await prisma.sponsorshipApplication.findFirst({
      where: {
        opportunityId: id as string,
        sponsorId: session.user.id,
      }
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this opportunity' });
    }

    // Create the application with a manual try/catch for database errors
    try {
      const application = await prisma.sponsorshipApplication.create({
        data: {
          opportunityId: id as string,
          sponsorId: session.user.id,
          amount,
          currency: req.body.currency || "USD", // Use the currency from the request or default to USD
          message,
          status: 'PENDING',
          // New fields
          sponsorName,
          contactPerson,
          email,
          phone,
          website,
          sponsorshipType,
          otherType: sponsorshipType === 'OTHER' ? otherType : null,
        }
      });

      // Create notification for opportunity owner
      try {
        await prisma.notification.create({
          data: {
            userId: 'admin', // Replace with actual creator ID if available
            title: 'New Sponsorship Application',
            message: `${sponsorName} has applied to sponsor your opportunity.`,
            type: 'APPLICATION',
            read: false,
          }
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the entire request just because notification failed
      }

      return res.status(201).json(application);
    } catch (dbError: any) {
      console.error('Database error during application creation:', dbError);
      
      if (dbError instanceof PrismaClientKnownRequestError) {
        if (dbError.code === 'P2002') {
          return res.status(409).json({ message: 'You have already applied for this opportunity' });
        }
      }
      
      // For connection errors
      return res.status(503).json({ 
        message: 'Database connection issue. Please try again later.',
        detail: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 