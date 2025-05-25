import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define interfaces for our types
interface SponsorshipOpportunity {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  minAmount: number;
  maxAmount: number;
  currency: string;
  status: string;
  deadline: Date | null;
  startupCallId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schema for the request body
const applicationSchema = z.object({
  // Sponsor Information
  sponsorType: z.enum(['COMPANY', 'INDIVIDUAL', 'NGO', 'FOUNDATION', 'OTHER']),
  organizationName: z.string().optional(),
  legalName: z.string().min(2, "Legal name is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  description: z.string().min(50, "Please provide a detailed description"),
  annualBudget: z.string().optional(),
  size: z.string().optional(),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  taxStatus: z.string().optional(),

  // Contact Information
  primaryContact: z.object({
    name: z.string().min(2, "Contact name is required"),
    title: z.string().min(2, "Job title is required"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().min(10, "Please enter a valid phone number"),
  }),
  alternateContact: z
    .object({
      name: z.string(),
      title: z.string(),
      email: z.string().email("Please enter a valid email"),
      phone: z.string(),
    })
    .optional(),

  // Sponsorship Details
  opportunityId: z.string().min(1, "Opportunity ID is required"),
  proposedAmount: z.number().min(1, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
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
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the user session
  const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
  }

    // Verify user is a sponsor
    if (session.user.role !== "SPONSOR") {
      return res.status(403).json({ error: "Only sponsors can submit applications" });
    }

    // Validate request body
    const validatedData = applicationSchema.parse(req.body);
      
    // Verify the opportunity exists and is open
      const opportunity = await prisma.sponsorshipOpportunity.findUnique({
      where: { id: validatedData.opportunityId },
    });
      
      if (!opportunity) {
      return res.status(404).json({ error: "Sponsorship opportunity not found" });
      }
      
    // Check if the opportunity is still open
    if (opportunity.status !== "OPEN" || (opportunity.deadline && new Date(opportunity.deadline) < new Date())) {
      return res.status(400).json({ error: "This opportunity is no longer accepting applications" });
      }
      
    // Check if the user has already applied
      const existingApplication = await prisma.sponsorshipApplication.findFirst({
        where: {
        opportunityId: validatedData.opportunityId,
          sponsorId: session.user.id,
      },
      });
      
      if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this opportunity" });
      }
      
      // Create the application
      const application = await prisma.sponsorshipApplication.create({
        data: {
        opportunityId: validatedData.opportunityId,
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
        currency: validatedData.currency,
        sponsorshipGoals: validatedData.sponsorshipGoals,
        hasPreviousSponsorships: validatedData.hasPreviousSponsorships,
        previousSponsorshipsDetails: validatedData.previousSponsorshipsDetails,
        preferredPaymentSchedule: validatedData.preferredPaymentSchedule,
        additionalRequests: validatedData.additionalRequests,
        status: "PENDING",
        proposedStartDate: validatedData.proposedStartDate,
        proposedEndDate: validatedData.proposedEndDate,
      },
      });
      
    // Create a notification for the opportunity owner
    await prisma.notification.create({
      data: {
        userId: opportunity.createdById,
        title: "New Sponsorship Application",
        message: `${validatedData.organizationName} has applied to sponsor "${opportunity.title}"`,
        type: "SPONSORSHIP_APPLICATION",
        link: `/admin/sponsorship-applications/${application.id}`,
      },
    });
      
      return res.status(201).json(application);
    } catch (error) {
    console.error("Error creating sponsorship application:", error);
      
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to get applications based on user role
async function getApplicationsForUser(userId: string, role: string) {
  // Admins can see all applications
  if (role === 'ADMIN') {
    return prisma.sponsorshipApplication.findMany({
      orderBy: {
        createdAt: 'desc'
      },
        include: {
          opportunity: {
            select: {
            id: true,
              title: true,
            currency: true,
              minAmount: true,
              maxAmount: true,
            status: true,
          }
        },
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }
  
  // Regular users (sponsors) can only see their own applications
  return prisma.sponsorshipApplication.findMany({
    where: {
      sponsorId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          currency: true,
          minAmount: true,
          maxAmount: true,
          status: true,
        }
      }
    }
  });
} 