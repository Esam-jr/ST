import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';

// Define validation schema for the request body
const applicationSchema = z.object({
  sponsorType: z.enum(['COMPANY', 'INDIVIDUAL', 'NGO', 'FOUNDATION', 'OTHER']),
  legalName: z.string().min(2, "Legal name is required"),
  organizationName: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().min(50, "Please provide a detailed description"),
  annualBudget: z.string().optional(),
  size: z.string().optional(),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  taxStatus: z.string().optional(),
  primaryContact: z.object({
    name: z.string().min(2, "Contact name is required"),
    title: z.string().min(2, "Job title is required"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Please enter a valid phone number"),
  }),
  alternateContact: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email("Please enter a valid email"),
    phone: z.string(),
  }).optional(),
  proposedAmount: z.number().min(1, "Amount must be greater than 0"),
  sponsorshipGoals: z.string().min(10, "Please describe your sponsorship goals"),
  hasPreviousSponsorships: z.boolean().default(false),
  previousSponsorshipsDetails: z.string().optional(),
  preferredPaymentSchedule: z.string().optional(),
  additionalRequests: z.string().optional(),
  proposedStartDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  proposedEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

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

    // Validate request body
    const validatedData = applicationSchema.parse(req.body);

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
        createdById: true,
        currency: true,
      }
    });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Check if the opportunity is still open
    if (opportunity.status !== 'OPEN') {
      return res.status(400).json({ message: 'This opportunity is not accepting applications' });
    }

    // Check deadline
    if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
      return res.status(400).json({ message: 'The application deadline has passed' });
    }

    // Check amount limits
    if (validatedData.proposedAmount < opportunity.minAmount || validatedData.proposedAmount > opportunity.maxAmount) {
      return res.status(400).json({
        message: `Proposed amount must be between ${opportunity.minAmount} and ${opportunity.maxAmount} ${opportunity.currency}` 
      });
    }

    // Check for existing application
    const existingApplication = await prisma.sponsorshipApplication.findFirst({
      where: {
        opportunityId: id as string,
        sponsorId: session.user.id,
      }
    });

    if (existingApplication) {
      return res.status(409).json({ message: 'You have already applied for this opportunity' });
    }

    // Create the application
      const application = await prisma.sponsorshipApplication.create({
        data: {
          opportunityId: id as string,
          sponsorId: session.user.id,
        sponsorType: validatedData.sponsorType,
        organizationName: validatedData.organizationName,
        legalName: validatedData.legalName,
        website: validatedData.website,
        description: validatedData.description,
        annualBudget: validatedData.annualBudget,
        size: validatedData.size,
        foundedYear: validatedData.foundedYear,
        headquarters: validatedData.headquarters,
        taxStatus: validatedData.taxStatus,
        primaryContact: validatedData.primaryContact,
        alternateContact: validatedData.alternateContact,
        proposedAmount: validatedData.proposedAmount,
        currency: opportunity.currency,
        sponsorshipGoals: validatedData.sponsorshipGoals,
        hasPreviousSponsorships: validatedData.hasPreviousSponsorships,
        previousSponsorshipsDetails: validatedData.previousSponsorshipsDetails,
        preferredPaymentSchedule: validatedData.preferredPaymentSchedule,
        additionalRequests: validatedData.additionalRequests,
        proposedStartDate: validatedData.proposedStartDate,
        proposedEndDate: validatedData.proposedEndDate,
        status: 'PENDING'
        }
      });

      // Create notification for opportunity owner
        await prisma.notification.create({
          data: {
        userId: opportunity.createdById,
            title: 'New Sponsorship Application',
        message: `${validatedData.organizationName || validatedData.legalName} has applied to sponsor "${opportunity.title}"`,
        type: 'SPONSORSHIP_APPLICATION',
            read: false,
        link: `/admin/sponsorship-applications/${application.id}`,
          }
    }).catch(error => {
      // Log but don't fail the request if notification creation fails
      console.error('Error creating notification:', error);
    });

      return res.status(201).json(application);
  } catch (error: any) {
    console.error('Error handling application:', error);
      
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
          return res.status(409).json({ message: 'You have already applied for this opportunity' });
        }
      }
      
    return res.status(500).json({ 
      message: 'Failed to submit application',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 