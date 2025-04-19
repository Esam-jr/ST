import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

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
  const session = await getServerSession(req, res, authOptions);
  
  // GET - Fetch startup calls
  if (req.method === 'GET') {
    try {
      // Define base query with filtering conditions
      const queryConditions: any = {
        where: {},
        orderBy: { updatedAt: 'desc' }
      };
      
      // Filter based on user role
      if (session?.user) {
        // Admin can see all calls
        if (session.user.role === 'ADMIN') {
          // No additional filters needed
        } 
        // Entrepreneurs can see published and closed calls
        else if (session.user.role === 'ENTREPRENEUR') {
          queryConditions.where = {
            OR: [
              { status: 'PUBLISHED' },
              { status: 'CLOSED' }
            ]
          };
        } 
        // Other authenticated users can see published calls
        else {
          queryConditions.where = { status: 'PUBLISHED' };
        }
      } 
      // Unauthenticated users can see published and closed calls
      else {
        queryConditions.where = {
          OR: [
            { status: 'PUBLISHED' },
            { status: 'CLOSED' }
          ]
        };
      }
      
      // Fetch startup calls from database
      const startupCalls = await prisma.startupCall.findMany(queryConditions);
      
      // For entrepreneurs, include application status for each call
      if (session?.user?.role === 'ENTREPRENEUR') {
        // Get all applications for this user
        const applications = await prisma.startupCallApplication.findMany({
          where: { userId: session.user.id },
          select: { callId: true, status: true }
        });
        
        // Create a map of callId to application status
        const applicationStatusMap = applications.reduce((map: ApplicationStatusMap, app: { callId: string, status: string }) => {
          map[app.callId] = app.status;
          return map;
        }, {} as ApplicationStatusMap);
        
        // Add application status to each call
        const callsWithApplicationStatus = startupCalls.map((call: any) => ({
          ...call,
          applicationStatus: applicationStatusMap[call.id] || ApplicationStatus.NOT_APPLIED
        }));
        
        return res.status(200).json(callsWithApplicationStatus);
      }
      
      return res.status(200).json(startupCalls);
    } catch (error) {
      console.error('Error fetching startup calls:', error);
      return res.status(500).json({ message: 'Error fetching startup calls' });
    }
  }
  
  // POST - Create a new startup call
  if (req.method === 'POST') {
    // Only admin can create startup calls
    if (!session?.user || session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
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
      
      // Create new startup call in database
      const newStartupCall = await prisma.startupCall.create({
        data: {
          title,
          description,
          applicationDeadline: new Date(applicationDeadline),
          publishedDate: status === 'PUBLISHED' ? new Date() : null,
          industry,
          location,
          fundingAmount,
          requirements: requirements || [],
          eligibilityCriteria: eligibilityCriteria || [],
          selectionProcess: selectionProcess || [],
          aboutSponsor,
          applicationProcess,
          status: status || 'DRAFT',
          createdBy: {
            connect: { id: session.user.id }
          }
        }
      });
      
      return res.status(201).json(newStartupCall);
    } catch (error) {
      console.error('Error creating startup call:', error);
      return res.status(500).json({ message: 'Error creating startup call' });
    }
  }
  
  // For all other HTTP methods
  return res.status(405).json({ message: 'Method not allowed' });
} 