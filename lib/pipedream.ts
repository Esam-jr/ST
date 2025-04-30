/**
 * Pipedream integration utilities
 */

/**
 * Send event data to Pipedream webhook
 */
export async function announceEvent(eventData: any): Promise<Response> {
  const webhookUrl = process.env.PIPEDREAM_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error('Pipedream webhook URL not configured');
  }
  
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...eventData,
      timestamp: new Date().toISOString(),
      source: 'startup-tracker-api'
    }),
  });
}

/**
 * Helper to generate social media content from event data
 */
export function generateSocialContent(event: {
  title: string;
  description: string;
  startDate: Date;
  location?: string | null;
  isVirtual?: boolean | null;
}): Record<string, string> {
  const dateStr = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const locationStr = event.isVirtual 
    ? 'Virtual Event'
    : event.location || 'TBA';

  return {
    facebook: `📢 Join us for ${event.title}!\n\n${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}\n\n📅 ${dateStr}\n📍 ${locationStr}\n\n#StartupEvents #Innovation`,
    
    linkedin: `🚀 Event Announcement: ${event.title}\n\n${event.description.substring(0, 250)}${event.description.length > 250 ? '...' : ''}\n\n📅 When: ${dateStr}\n📍 Where: ${locationStr}\n\n#StartupCommunity #Networking #Innovation`,
    
    twitter: `Join us for ${event.title} on ${dateStr}! ${locationStr}. #StartupEvents #Innovation`
  };
} 