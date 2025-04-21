import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import withPrisma from '@/lib/prisma-wrapper';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow only PUT and DELETE methods
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized. Only admins can manage reviewers.' });
    }

    // Get reviewer ID from the route
    const { id } = req.query;
    const reviewerId = Array.isArray(id) ? id[0] : id;

    if (!reviewerId) {
      return res.status(400).json({ message: 'Missing reviewer ID' });
    }

    // Check if reviewer exists and is a reviewer
    const existingReviewer = await withPrisma(() => 
      prisma.user.findFirst({
        where: { 
          id: reviewerId,
          role: Role.REVIEWER
        }
      })
    );

    if (!existingReviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      // Check if reviewer has assigned reviews before deleting
      const reviewCount = await withPrisma(() => 
        prisma.applicationReview.count({
          where: {
            reviewerId,
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        })
      );

      if (reviewCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete reviewer with ${reviewCount} active review assignments. Reassign or complete them first.` 
        });
      }

      // Delete the reviewer
      await withPrisma(() => 
        prisma.user.delete({
          where: { id: reviewerId }
        })
      );

      return res.status(200).json({ message: 'Reviewer deleted successfully' });
    }

    // Handle PUT request (update)
    if (req.method === 'PUT') {
      const { name, email, password, status, expertise } = req.body;

      // Prepare update data
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email && email !== existingReviewer.email) {
        // Check if new email already exists
        const emailExists = await withPrisma(() => 
          prisma.user.findFirst({
            where: { 
              email,
              id: { 
                not: reviewerId 
              }
            }
          })
        );

        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use by another user' });
        }

        updateData.email = email;
      }

      // If password is provided, hash it
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        updateData.password = await hash(password, 10);
      }

      // Update reviewer
      const updatedReviewer = await withPrisma(() => 
        prisma.user.update({
          where: { id: reviewerId },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            applicationReviews: {
              select: {
                id: true,
                status: true,
              }
            }
          }
        })
      );

      // Transform response data
      const totalReviews = updatedReviewer.applicationReviews.length;
      const completedReviews = updatedReviewer.applicationReviews.filter(
        r => r.status === 'COMPLETED'
      ).length;
      const pendingReviews = totalReviews - completedReviews;

      // Remove applicationReviews from the response
      const { applicationReviews, ...rest } = updatedReviewer;

      const formattedReviewer = {
        ...rest,
        status: status || 'active',
        joinedDate: updatedReviewer.createdAt,
        assignedReviews: totalReviews,
        completedReviews,
        pendingReviews,
        expertise: expertise || [],
      };

      return res.status(200).json({
        message: 'Reviewer updated successfully',
        reviewer: formattedReviewer
      });
    }
  } catch (error) {
    console.error(`Error ${req.method === 'DELETE' ? 'deleting' : 'updating'} reviewer:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 