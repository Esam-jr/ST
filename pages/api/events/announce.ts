import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { announceEvent, generateSocialContent } from '@/lib/pipedream';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get event ID from request body
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Fetch the event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prepare event data for Pipedream
    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      imageUrl: event.imageUrl,
      type: event.type,
      // Add generated social media content
      socialContent: generateSocialContent(event)
    };

    // Trigger the Pipedream webhook
    const response = await announceEvent(eventData);

    if (!response.ok) {
      throw new Error(`Pipedream webhook failed with status ${response.status}`);
    }

    // Return success response
    return res.status(200).json({ 
      message: 'Event announcement triggered successfully',
      eventId: event.id,
      title: event.title,
    });
  } catch (error) {
    console.error('Error announcing event:', error);
    return res.status(500).json({ 
      message: 'Failed to announce event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 