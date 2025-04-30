import { useState } from 'react';
import { NextPage } from 'next';
import Layout from '@/components/layout/Layout';
import EventAnnouncement from '@/components/admin/EventAnnouncement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Calendar, FileText } from 'lucide-react';

const EventAnnouncerPage: NextPage = () => {
  const router = useRouter();
  
  return (
    <Layout title="Event Announcer | Admin">
      <div className="container mx-auto py-6 space-y-6">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b">
          <Link href="/admin/events" className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </div>
          </Link>
          <Link href="/admin/event-announcer" className="mr-4 px-4 py-2 text-primary font-medium border-b-2 border-primary">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Event Announcer
            </div>
          </Link>
          <Link href="/admin/advertisements" className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Advertisements
            </div>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Event Announcer</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Announce Events</CardTitle>
            <CardDescription>
              Announce events to social media platforms and email subscribers using Pipedream.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventAnnouncement showList={true} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EventAnnouncerPage; 