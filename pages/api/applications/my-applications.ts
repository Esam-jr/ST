import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

// Type definitions
type CallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

interface StartupCall {
  id: string;
  title: string;
  description: string;
  status: CallStatus;
  applicationDeadline: string;
  publishedDate: string;
  industry: string;
  location: string;
  fundingAmount?: string;
  requirements: string[];
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor?: string;
  applicationProcess: string;
  applicationStatus: ApplicationStatus;
}

// Mock data - in a real app this would come from a database
const mockApplications: StartupCall[] = [
  {
    id: "call-1",
    title: "Tech Innovation Fund",
    description: "Funding for technology startups with innovative solutions.",
    status: "PUBLISHED",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    publishedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    industry: "Technology",
    location: "Global",
    fundingAmount: "Up to $100,000",
    requirements: ["Early-stage startup", "Innovative tech solution", "Scalable business model"],
    eligibilityCriteria: [
      "Registered business entity",
      "Less than 5 years in operation",
      "Prototype or MVP ready"
    ],
    selectionProcess: [
      "Initial application screening",
      "Pitch presentation to selection committee",
      "Due diligence and final selection"
    ],
    applicationProcess: "Submit your application through our online portal with details about your startup, team, product, and how the funding will be used.",
    applicationStatus: "SUBMITTED"
  },
  {
    id: "call-2",
    title: "Healthcare Innovation Grant",
    description: "Supporting startups developing healthcare solutions for underserved markets.",
    status: "PUBLISHED",
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    publishedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    industry: "Healthcare",
    location: "North America, Europe",
    fundingAmount: "$50,000 - $150,000",
    requirements: ["Healthcare focus", "Social impact", "Sustainable model"],
    eligibilityCriteria: [
      "Healthcare industry focus",
      "Solution addressing underserved populations",
      "Team with healthcare expertise"
    ],
    selectionProcess: [
      "Application review",
      "Expert panel evaluation",
      "Final pitches and selection"
    ],
    applicationProcess: "Complete the application form, including your healthcare solution details, target market, impact metrics, and funding plan.",
    applicationStatus: "UNDER_REVIEW"
  },
  {
    id: "call-3",
    title: "Sustainability Accelerator",
    description: "Accelerator program for startups with environmental sustainability focus.",
    status: "CLOSED",
    applicationDeadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    publishedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    industry: "Energy",
    location: "Global",
    requirements: ["Sustainability focus", "Measurable impact", "Growth potential"],
    eligibilityCriteria: [
      "Clear sustainability impact",
      "Working prototype",
      "Full-time founding team"
    ],
    selectionProcess: [
      "Initial application screening",
      "Interview with accelerator team",
      "Selection committee review"
    ],
    applicationProcess: "Apply with your sustainability solution, impact metrics, and growth plan. Selected startups will join a 3-month accelerator program.",
    applicationStatus: "APPROVED"
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has the ENTREPRENEUR role
    const user = await withPrisma(() => 
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    );

    if (!user || user.role !== 'ENTREPRENEUR') {
      return res.status(403).json({ message: 'Not authorized to view applications' });
    }

    // Fetch applications for the authenticated entrepreneur with error handling
    const applications = await withPrisma(() => 
      prisma.startupCallApplication.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          call: {
            select: {
              id: true,
              title: true,
              status: true,
              applicationDeadline: true,
              industry: true,
              location: true,
              fundingAmount: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      })
    );

    // Format and return the applications
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      startupName: app.startupName,
      industry: app.industry,
      stage: app.stage,
      status: app.status,
      submittedAt: app.submittedAt,
      updatedAt: app.updatedAt,
      reviewsCompleted: app.reviewsCompleted,
      reviewsTotal: app.reviewsTotal,
      call: {
        id: app.call.id,
        title: app.call.title,
        status: app.call.status,
        applicationDeadline: app.call.applicationDeadline,
        industry: app.call.industry,
        location: app.call.location,
        fundingAmount: app.call.fundingAmount
      }
    }));

    return res.status(200).json(formattedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 