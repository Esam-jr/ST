# Event Promotion with Pipedream

This guide explains how to integrate Pipedream with your Startup Tracker to automatically promote events on social media platforms.

## Overview

When a new event is created in your Startup Tracker, you can use the EventAnnouncer component to send the event details to Pipedream. Pipedream will then handle posting the event to Facebook, LinkedIn, and optionally sending email notifications.

## Setup Steps

### 1. Create a Pipedream Account

If you don't already have one, sign up for a free account at [pipedream.com](https://pipedream.com).

### 2. Create a New Workflow in Pipedream

1. Log in to your Pipedream account
2. Click "Create Workflow"
3. Select "HTTP / Webhook" as the trigger
4. Copy the generated webhook URL

### 3. Configure Your Startup Tracker

Run the setup script included in this project:

```bash
node scripts/setup-pipedream.js
```

When prompted, paste the webhook URL you copied from Pipedream.

### 4. Add Steps to Your Pipedream Workflow

In your Pipedream workflow, add steps to:

1. Process the incoming webhook data
2. Post to Facebook (using Facebook's API)
3. Post to LinkedIn (using LinkedIn's API)
4. Send email notifications (optional)

Example Pipedream workflow step to post to Facebook:

```javascript
// This code runs in Pipedream
import { axios } from "@pipedream/platform";

export default defineComponent({
  async run({ steps, $ }) {
    // Get the event data from the webhook
    const event = steps.trigger.event;
    
    // Get the Facebook content from the generated socialContent
    const content = event.body.socialContent.facebook;
    
    // Post to Facebook using your page access token
    return await axios($, {
      url: `https://graph.facebook.com/v17.0/YOUR_PAGE_ID/feed`,
      method: "POST",
      params: {
        message: content,
        access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      },
    });
  },
});
```

Add similar steps for LinkedIn and email notifications.

## Using the Event Announcer

1. Create events in your Startup Tracker
2. Go to the Event Announcer component
3. Click the "Announce" button next to any event
4. The event will be sent to Pipedream, which will handle posting to social media

## Environment Variables

- `PIPEDREAM_WEBHOOK_URL`: The webhook URL for your Pipedream workflow

You will also need to set up API credentials for the social platforms in your Pipedream workflow.

## Troubleshooting

- Check the Pipedream workflow logs for any errors
- Ensure your social media API credentials are valid
- Verify the webhook URL is correctly set in your environment variables

## Learn More

- [Pipedream Documentation](https://pipedream.com/docs/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/) 