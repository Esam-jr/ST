import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import axios from "axios";

// Use real Facebook API implementation
async function publishToFacebook(ad: any) {
  console.log(`[Facebook] Publishing ad: ${ad.title}`);

  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      success: false,
      platform: "Facebook",
      message: "Facebook access token not configured",
    };
  }

  try {
    // Facebook Graph API endpoint for posting to page feed
    // Note: This assumes the token has permissions to publish to a page
    const pageId = "me"; // Change to specific page ID if needed
    const url = `https://graph.facebook.com/v16.0/${pageId}/feed`;

    // Format the content for Facebook
    const message = `${ad.title}\n\n${ad.content}`;

    // Prepare the request data with proper typing
    const postData: {
      message: string;
      access_token: string;
      link?: string;
    } = {
      message: message,
      access_token: accessToken,
    };

    // Add image if available
    if (ad.imageUrl) {
      postData.link = ad.imageUrl;
    }

    // Make the API request
    const response = await axios.post(url, postData);

    return {
      success: true,
      publishedId: response.data.id || `fb_${Date.now()}`,
      platform: "Facebook",
      message: "Advertisement published to Facebook successfully",
      postUrl: `https://facebook.com/${response.data.id}`,
    };
  } catch (error: any) {
    // Type error as any to access properties
    console.error(
      "[Facebook API Error]",
      error.response?.data || error.message
    );
    return {
      success: false,
      platform: "Facebook",
      message:
        error.response?.data?.error?.message || "Failed to publish to Facebook",
    };
  }
}

async function publishToTwitter(ad: any) {
  console.log(`[Twitter] Publishing ad: ${ad.title}`);

  // In a real implementation, you would use the Twitter API

  // Mock successful publish
  return {
    success: true,
    publishedId: `tw_${Date.now()}`,
    platform: "Twitter",
    message: "Advertisement published to Twitter successfully",
  };
}

async function publishToLinkedIn(ad: any) {
  console.log(`[LinkedIn] Publishing ad: ${ad.title}`);

  // In a real implementation, you would use the LinkedIn API

  // Mock successful publish
  return {
    success: true,
    publishedId: `li_${Date.now()}`,
    platform: "LinkedIn",
    message: "Advertisement published to LinkedIn successfully",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only handle POST requests for publishing
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: { role: true },
  });

  // Check if user has admin role
  if (user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  // Get advertisement ID and platforms from request body
  const { adId, platforms } = req.body;

  if (
    !adId ||
    !platforms ||
    !Array.isArray(platforms) ||
    platforms.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Invalid request. Missing adId or platforms." });
  }

  try {
    // Get the advertisement
    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return res.status(404).json({ error: "Advertisement not found" });
    }

    // Check if ad is in published status
    if (ad.status !== "published") {
      return res.status(400).json({
        error:
          "Advertisement must be in published status before sharing on social media",
      });
    }

    // Publish to each platform and collect results
    const results = [];
    const updatedPlatforms = [...ad.platforms];

    for (const platform of platforms) {
      let result;

      switch (platform.toLowerCase()) {
        case "facebook":
          result = await publishToFacebook(ad);
          break;
        case "twitter":
          result = await publishToTwitter(ad);
          break;
        case "linkedin":
          result = await publishToLinkedIn(ad);
          break;
        default:
          result = {
            success: false,
            platform,
            message: `Unsupported platform: ${platform}`,
          };
      }

      results.push(result);

      // Add platform to ad's platforms list if not already present
      if (result.success && !updatedPlatforms.includes(platform)) {
        updatedPlatforms.push(platform);
      }
    }

    // Update the advertisement with the new platforms
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        platforms: updatedPlatforms,
      },
    });

    // Return results
    return res.status(200).json({
      message: "Social media publishing completed",
      results,
      advertisement: {
        id: ad.id,
        title: ad.title,
        platforms: updatedPlatforms,
      },
    });
  } catch (error) {
    console.error("Error publishing to social media:", error);
    return res.status(500).json({
      error: "Failed to publish advertisement to social media",
      details:
        process.env.NODE_ENV !== "production" && error instanceof Error
          ? error.message
          : undefined,
    });
  }
}
