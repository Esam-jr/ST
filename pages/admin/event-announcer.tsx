import { useState } from 'react';
import { NextPage } from 'next';
import AdminLayout from '@/components/layouts/AdminLayout';
import EventAnnouncement from '@/components/admin/EventAnnouncement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EventAnnouncerPage: NextPage = () => {
  return (
    <AdminLayout title="Event Announcer">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Announcer</CardTitle>
            <CardDescription>
              Announce events to social media platforms and email subscribers using Pipedream.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventAnnouncement showList={true} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EventAnnouncerPage; 