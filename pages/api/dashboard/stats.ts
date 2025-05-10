import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import {
  StartupCallStatus,
  StartupCallApplicationStatus,
  Status,
} from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const today = new Date();

    // Calculate general platform stats
    const stats: any = {};

    // Entrepreneur-specific stats
    if (userRole === "ENTREPRENEUR") {
      // Total applications submitted by the entrepreneur
      const totalApplications = await prisma.startupCallApplication.count({
        where: {
          userId,
        },
      });

      // Applications currently under review
      const submissionsInReview = await prisma.startupCallApplication.count({
        where: {
          userId,
          status: StartupCallApplicationStatus.UNDER_REVIEW,
        },
      });

      // Number of approved projects/applications
      const approvedProjects = await prisma.startupCallApplication.count({
        where: {
          userId,
          status: StartupCallApplicationStatus.APPROVED,
        },
      });

      // Count active/open calls entrepreneur can apply to
      const openOpportunities = await prisma.startupCall.count({
        where: {
          status: StartupCallStatus.PUBLISHED,
          applicationDeadline: {
            gte: today,
          },
        },
      });

      // Count total reviews received for entrepreneur's applications
      const totalReviews = await prisma.applicationReview.count({
        where: {
          application: {
            userId,
          },
        },
      });

      // Aggregate the data
      stats.ENTREPRENEUR = {
        totalApplications,
        submissionsInReview,
        approvedProjects,
        openOpportunities,
        reviewsReceived: totalReviews,
      };
    }

    // Reviewer-specific stats
    else if (userRole === "REVIEWER") {
      // Total assigned reviews
      const assignedReviews = await prisma.reviewAssignment.count({
        where: {
          reviewerId: userId,
        },
      });

      // Completed reviews
      const completedReviews = await prisma.reviewAssignment.count({
        where: {
          reviewerId: userId,
          status: "COMPLETED",
        },
      });

      // Pending reviews
      const pendingReviews = assignedReviews - completedReviews;

      // Get average score from reviews
      const reviews = await prisma.applicationReview.findMany({
        where: {
          reviewerId: userId,
          score: {
            not: null,
          },
        },
        select: {
          score: true,
        },
      });

      const totalScore = reviews.reduce(
        (sum, review) => sum + (review.score || 0),
        0
      );
      const avgScore = reviews.length > 0 ? totalScore / reviews.length : 0;

      // Count unique startups reviewed
      const uniqueStartups = await prisma.applicationReview.findMany({
        where: {
          reviewerId: userId,
        },
        select: {
          applicationId: true,
        },
        distinct: ["applicationId"],
      });

      // Calculate reviews completed this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const reviewsThisMonth = await prisma.applicationReview.count({
        where: {
          reviewerId: userId,
          completedAt: {
            gte: startOfMonth,
          },
        },
      });

      // Aggregate the data
      stats.REVIEWER = {
        assignedReviews,
        completedReviews,
        pendingReviews,
        avgScore,
        totalStartupsReviewed: uniqueStartups.length,
        reviewsThisMonth,
      };
    }

    // Sponsor-specific stats
    else if (userRole === "SPONSOR") {
      // Active investments
      const activeInvestments = await prisma.sponsorship.count({
        where: {
          sponsorId: userId,
          status: "ACTIVE",
        },
      });

      // Total funded amount
      const sponsorships = await prisma.sponsorship.findMany({
        where: {
          sponsorId: userId,
        },
        select: {
          amount: true,
        },
      });

      const totalFunded = sponsorships.reduce(
        (sum, sponsorship) => sum + sponsorship.amount,
        0
      );

      // Potential deals (applications awaiting approval)
      const potentialDeals = await prisma.sponsorshipApplication.count({
        where: {
          sponsorId: userId,
          status: "PENDING",
        },
      });

      // Sponsored startups count
      const sponsoredStartups = await prisma.sponsorship.findMany({
        where: {
          sponsorId: userId,
        },
        select: {
          startupId: true,
        },
        distinct: ["startupId"],
      });

      // Upcoming pitch/meetings with entrepreneurs
      const upcomingPitches = await prisma.meeting.count({
        where: {
          userId,
          startTime: {
            gte: today,
          },
        },
      });

      // Aggregate the data
      stats.SPONSOR = {
        activeInvestments,
        totalFunded,
        potentialDeals,
        sponsoredStartups: sponsoredStartups.length,
        upcomingPitches,
        // For investment returns, this would typically come from a more complex calculation
        // For now, we'll use a placeholder
        investmentReturns: Math.round(totalFunded * 0.2), // 20% return as placeholder
      };
    }

    // Admin-specific stats
    else if (userRole === "ADMIN") {
      // Total users on platform
      const totalUsers = await prisma.user.count();

      // Total startups
      const totalStartups = await prisma.startup.count();

      // Total reviews
      const totalReviews = await prisma.applicationReview.count();

      // Total sponsors
      const totalSponsors = await prisma.user.count({
        where: {
          role: "SPONSOR",
        },
      });

      // Total funding across platform
      const sponsorships = await prisma.sponsorship.findMany({
        select: {
          amount: true,
        },
      });

      const totalFunding = sponsorships.reduce(
        (sum, sponsorship) => sum + sponsorship.amount,
        0
      );

      // Active users (users who logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await prisma.session.findMany({
        where: {
          expires: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      // Aggregate the data
      stats.ADMIN = {
        totalUsers,
        totalStartups,
        totalReviews,
        totalSponsors,
        totalFunding,
        activeUsers: activeUsers.length,
      };
    }

    // Default stats for all roles
    const defaultStats = {
      totalApplications: 0,
      approvedProjects: 0,
      openOpportunities: 0,
    };

    return res.status(200).json({
      ...stats,
      USER: defaultStats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ message: "Error fetching dashboard stats" });
  }
}
