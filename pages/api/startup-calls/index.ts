import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // GET /api/startup-calls - Get all startup calls
  if (req.method === 'GET') {
    try {
      // Different handling based on user role
      if (session.user.role === 'ADMIN') {
        // Admins see all calls
        const startupCalls = await prisma.startupCall.findMany({
          orderBy: { 
            createdAt: 'desc'
          },
          include: {
            _count: {
              select: { applications: true }
            }
          }
        });

        return res.status(200).json(startupCalls);
      } else {
        // Regular users only see published calls
        const startupCalls = await prisma.startupCall.findMany({
          where: {
            status: 'PUBLISHED',
            applicationDeadline: {
              gte: new Date()
            }
          },
          orderBy: { 
            publishedDate: 'desc'
          }
        });

        // For entrepreneurs, include their application status
        if (session.user.role === 'ENTREPRENEUR') {
          const callsWithApplicationStatus = await Promise.all(
            startupCalls.map(async (call) => {
              const application = await prisma.startupCallApplication.findFirst({
                where: {
                  callId: call.id,
                  userId: session.user.id
                }
              });

              return {
                ...call,
                applicationStatus: application 
                  ? application.status
                  : 'NOT_APPLIED'
              };
            })
          );

          return res.status(200).json(callsWithApplicationStatus);
        }

        return res.status(200).json(startupCalls);
      }
    } catch (error) {
      console.error('Error fetching startup calls:', error);
      return res.status(500).json({ message: 'Error fetching startup calls' });
    }
  }

  // POST /api/startup-calls - Create a new startup call
  if (req.method === 'POST') {
    // Only administrators can create startup calls
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to create startup calls' });
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

      // Create startup call
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
          createdById: session.user.id
        }
      });

      return res.status(201).json(newStartupCall);
    } catch (error) {
      console.error('Error creating startup call:', error);
      return res.status(500).json({ message: 'Error creating startup call' });
    }
  }

  // Return 405 Method Not Allowed for other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 