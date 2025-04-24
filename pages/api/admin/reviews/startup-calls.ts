import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import withPrisma from '@/lib/prisma-wrapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user is an admin
    const user = await withPrisma(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
    );

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get query parameters for filtering
    const { callId, status } = req.query;

    // Build base query
    const whereClause: any = {};
    
    // Add filters if provided
    if (callId && typeof callId === 'string') {
      whereClause.id = callId;
    }
    
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    // Fetch all startup calls with their applications and reviews
    const startupCalls = await withPrisma(() =>
      prisma.startupCall.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          status: true,
          industry: true,
          applicationDeadline: true,
          applications: {
            select: {
              id: true,
              startupName: true,
              industry: true,
              stage: true,
              status: true,
              submittedAt: true,
              reviewsCompleted: true,
              reviewsTotal: true,
              reviews: {
                select: {
                  id: true,
                  score: true,
                  innovationScore: true,
                  marketScore: true,
                  teamScore: true,
                  executionScore: true,
                  feedback: true,
                  status: true,
                  assignedAt: true,
                  completedAt: true,
                  reviewer: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          applicationDeadline: 'desc'
        }
      })
    );

    // Process the data to include average scores and rankings
    const processedCalls = startupCalls.map(call => {
      // Calculate average scores for each application
      const applications = call.applications.map(app => {
        // Calculate average scores from completed reviews
        const completedReviews = app.reviews.filter(review => review.status === 'COMPLETED');
        
        let avgScore = 0;
        let avgInnovationScore = 0;
        let avgMarketScore = 0;
        let avgTeamScore = 0;
        let avgExecutionScore = 0;
        
        if (completedReviews.length > 0) {
          avgScore = completedReviews.reduce((sum, review) => sum + (review.score || 0), 0) / completedReviews.length;
          avgInnovationScore = completedReviews.reduce((sum, review) => sum + (review.innovationScore || 0), 0) / completedReviews.length;
          avgMarketScore = completedReviews.reduce((sum, review) => sum + (review.marketScore || 0), 0) / completedReviews.length;
          avgTeamScore = completedReviews.reduce((sum, review) => sum + (review.teamScore || 0), 0) / completedReviews.length;
          avgExecutionScore = completedReviews.reduce((sum, review) => sum + (review.executionScore || 0), 0) / completedReviews.length;
        }
        
        return {
          ...app,
          averageScores: {
            overall: Number(avgScore.toFixed(1)),
            innovation: Number(avgInnovationScore.toFixed(1)),
            market: Number(avgMarketScore.toFixed(1)),
            team: Number(avgTeamScore.toFixed(1)),
            execution: Number(avgExecutionScore.toFixed(1))
          }
        };
      });
      
      // Sort applications by average score (descending)
      const sortedApplications = [...applications].sort((a, b) => 
        b.averageScores.overall - a.averageScores.overall
      );
      
      // Assign rankings
      const rankedApplications = sortedApplications.map((app, index) => ({
        ...app,
        rank: index + 1
      }));
      
      return {
        ...call,
        applications: rankedApplications
      };
    });

    // Return the processed startup calls
    return res.status(200).json(processedCalls);
    
  } catch (error) {
    console.error('Error fetching startup call reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 