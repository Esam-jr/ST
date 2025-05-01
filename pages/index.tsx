import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, LineChart, LucideRocket, Users, Wallet, Calendar, Megaphone } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import axios from 'axios';
import { useState } from 'react';

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

// Interface for the latest updates items
interface UpdateItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date?: string;
  type: 'event' | 'announcement';
  category: string;
  createdAt: string;
}

// Date formatter helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function Home() {
  const [email, setEmail] = useState('');

  // Fetch latest updates with SWR
  const { data: latestUpdates = [], error: updatesError } = useSWR<UpdateItem[]>(
    '/api/public/latest-updates',
    fetcher
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center md:py-32 md:px-10 lg:px-32 xl:max-w-6xl">
          <h1 className="text-4xl font-bold leading-none sm:text-5xl">
            Your Gateway to <span className="text-primary">Opportunities</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover startup calls, events, and resources to accelerate your innovation journey
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/startup-calls">
              <Button size="lg">
                Browse Startup Calls
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="lg">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest updates section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Latest Updates</h2>
              <p className="mt-4 text-lg text-gray-600">
                Stay informed about upcoming events and important announcements
              </p>
            </div>

            {updatesError ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Unable to load updates. Please refresh the page.</p>
              </div>
            ) : latestUpdates.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No updates available at the moment. Please check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestUpdates.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    {item.imageUrl && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${
                          item.type === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'event' ? (
                            <Calendar className="h-3 w-3 mr-1" />
                          ) : (
                            <Megaphone className="h-3 w-3 mr-1" />
                          )}
                          {item.category}
                        </span>
                        {item.date && (
                          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{item.description}</p>
                      <Link 
                        href={item.type === 'event' ? `/events/${item.id}` : `/announcements`} 
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        {item.type === 'event' ? 'View Event' : 'Read More'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-12 text-center">
              <Link href="/events">
                <Button variant="outline" size="lg" className="mr-4">
                  All Events
                </Button>
              </Link>
              <Link href="/announcements">
                <Button variant="outline" size="lg">
                  All Announcements
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Join Our Platform</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to accelerate your innovation journey
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LucideRocket className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Innovation Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access exclusive startup calls, challenges, and funding opportunities tailored to your interests.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Network & Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with a community of innovators, mentors, investors, and industry experts.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your applications, get timely updates, and manage your innovation pipeline efficiently.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="ml-4">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
