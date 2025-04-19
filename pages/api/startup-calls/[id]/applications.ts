import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Check if id is valid
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid startup call ID' });
  }

  // GET /api/startup-calls/:id/applications - Get all applications for a startup call
  if (req.method === 'GET') {
    try {
      // First check if the startup call exists
      const startupCall = await prisma.startupCall.findUnique({
        where: { id }
      });

      if (!startupCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      // Different handling based on user role
      if (session.user.role === 'ADMIN') {
        // Admins can see all applications for a call
        const applications = await prisma.startupCallApplication.findMany({
          where: { callId: id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        });

        return res.status(200).json(applications);
      } else if (session.user.role === 'ENTREPRENEUR') {
        // Entrepreneurs can only see their own applications
        const application = await prisma.startupCallApplication.findFirst({
          where: {
            callId: id,
            userId: session.user.id
          }
        });

        return res.status(200).json(application ? [application] : []);
      } else {
        return res.status(403).json({ message: 'Not authorized to view applications' });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ message: 'Error fetching applications' });
    }
  }

  // POST /api/startup-calls/:id/applications - Submit an application for a startup call
  if (req.method === 'POST') {
    // Only entrepreneurs can submit applications
    if (session.user.role !== 'ENTREPRENEUR') {
      return res.status(403).json({ message: 'Only entrepreneurs can submit applications' });
    }

    try {
      // Check if the startup call exists and is published
      const startupCall = await prisma.startupCall.findUnique({
        where: { id }
      });

      if (!startupCall) {
        return res.status(404).json({ message: 'Startup call not found' });
      }

      if (startupCall.status !== 'PUBLISHED') {
        return res.status(400).json({ message: 'Cannot apply to unpublished calls' });
      }

      // Check if application deadline has passed
      if (new Date() > new Date(startupCall.applicationDeadline)) {
        return res.status(400).json({ message: 'Application deadline has passed' });
      }

      // Check if user has already applied
      const existingApplication = await prisma.startupCallApplication.findFirst({
        where: {
          callId: id,
          userId: session.user.id
        }
      });

      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied to this call' });
      }

      // Extract application data from request body
      const {
        startupName,
        website,
        foundingDate,
        teamSize,
        industry,
        stage,
        description,
        problem,
        solution,
        traction,
        businessModel,
        funding,
        useOfFunds,
        competitiveAdvantage,
        founderBio,
        pitchDeckUrl,
        financialsUrl
      } = req.body;

      // Basic validation
      if (!startupName || !foundingDate || !industry || !stage || !description || !problem || 
          !solution || !businessModel || !useOfFunds || !competitiveAdvantage || !founderBio) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Get user's startup if it exists
      let startupId = null;
      const userStartup = await prisma.startup.findFirst({
        where: { founderId: session.user.id }
      });
      
      if (userStartup) {
        startupId = userStartup.id;
      }

      // Create application
      const newApplication = await prisma.startupCallApplication.create({
        data: {
          callId: id,
          userId: session.user.id,
          startupId,
          startupName,
          website,
          foundingDate: new Date(foundingDate),
          teamSize,
          industry,
          stage,
          description,
          problem,
          solution,
          traction,
          businessModel,
          funding,
          useOfFunds,
          competitiveAdvantage,
          founderBio,
          pitchDeckUrl,
          financialsUrl,
          status: 'SUBMITTED'
        }
      });

      return res.status(201).json(newApplication);
    } catch (error) {
      console.error('Error submitting application:', error);
      return res.status(500).json({ message: 'Error submitting application' });
    }
  }

  // Return 405 Method Not Allowed for other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 