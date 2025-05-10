import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import withPrisma from "@/lib/prisma-wrapper";
import {
  StartupCallStatus,
  StartupCallApplicationStatus,
} from "@prisma/client";

// Define enum for application status
enum ApplicationStatus {
  NOT_APPLIED = "NOT_APPLIED",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
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
  // Get the user's session for all operations
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  // For write operations, only allow ADMIN users
  if (req.method !== "GET" && userRole !== "ADMIN") {
    return res
      .status(403)
      .json({ message: "You do not have permission to perform this action" });
  }

  // Handle GET request
  if (req.method === "GET") {
    try {
      const { status, expired } = req.query;
      const today = new Date();

      // Set up the filter for calls
      const filter: any = {};

      // Filter by status if provided
      if (status) {
        filter.status = status as StartupCallStatus;
      }

      // Filter out expired calls if requested
      if (expired === "false") {
        filter.applicationDeadline = {
          gte: today,
        };
      }

      // Use withPrisma wrapper to handle prepared statement errors with automatic retries
      const calls = await withPrisma(async () => {
        return prisma.startupCall.findMany({
          where: filter,
          orderBy: {
            publishedDate: "desc",
          },
          include: {
            // Include application count
            _count: {
              select: {
                applications: true,
              },
            },
            // For each call, check if the user has applied
            applications:
              userId && userRole === "ENTREPRENEUR"
                ? {
                    where: {
                      userId: userId,
                    },
                    select: {
                      id: true,
                      status: true,
                    },
                  }
                : false,
          },
        });
      });

      // Transform the data to match the expected format
      const formattedCalls = calls.map((call) => {
        // Check if the entrepreneur has applied to this call
        let applicationStatus = "NOT_APPLIED";
        if (call.applications && call.applications.length > 0) {
          applicationStatus = call.applications[0].status;
        }

        return {
          id: call.id,
          title: call.title,
          description: call.description,
          status: call.status,
          applicationDeadline: call.applicationDeadline.toISOString(),
          publishedDate: call.publishedDate
            ? call.publishedDate.toISOString()
            : null,
          industry: call.industry,
          location: call.location,
          fundingAmount: call.fundingAmount,
          requirements: call.requirements,
          eligibilityCriteria: call.eligibilityCriteria,
          selectionProcess: call.selectionProcess,
          aboutSponsor: call.aboutSponsor,
          applicationProcess: call.applicationProcess,
          applicationStatus:
            userId && userRole === "ENTREPRENEUR"
              ? applicationStatus
              : undefined,
          _count: call._count,
          isExpired: new Date(call.applicationDeadline) < today,
        };
      });

      return res.status(200).json(formattedCalls);
    } catch (error) {
      console.error("Error fetching startup calls:", error);
      return res.status(500).json({
        message: "Error fetching startup calls",
        error: String(error),
      });
    }
  }

  // Handle POST request (Create new startup call)
  if (req.method === "POST") {
    try {
      const {
        title,
        description,
        status,
        applicationDeadline,
        publishedDate,
        industry,
        location,
        fundingAmount,
        requirements,
        eligibilityCriteria,
        selectionProcess,
        aboutSponsor,
        applicationProcess,
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !description ||
        !applicationDeadline ||
        !industry ||
        !location ||
        !applicationProcess
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create new startup call
      const newCall = await withPrisma(async () => {
        return prisma.startupCall.create({
          data: {
            title,
            description,
            status: status || "DRAFT",
            applicationDeadline: new Date(applicationDeadline),
            publishedDate: publishedDate ? new Date(publishedDate) : null,
            industry,
            location,
            fundingAmount,
            requirements: Array.isArray(requirements) ? requirements : [],
            eligibilityCriteria: Array.isArray(eligibilityCriteria)
              ? eligibilityCriteria
              : [],
            selectionProcess: Array.isArray(selectionProcess)
              ? selectionProcess
              : [],
            aboutSponsor,
            applicationProcess,
            createdBy: {
              connect: { id: userId },
            },
          },
        });
      });

      return res.status(201).json(newCall);
    } catch (error) {
      console.error("Error creating startup call:", error);
      return res
        .status(500)
        .json({ message: "Error creating startup call", error: String(error) });
    }
  }

  // Handle other methods (PUT, DELETE) in the [id].ts file
  return res.status(405).json({ message: "Method not allowed" });
}
