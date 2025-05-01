import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, LineChart, LucideRocket, Users, Wallet, Calendar, Megaphone } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';

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
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
      // Don't revalidate on focus to avoid excessive requests when there are issues
      revalidateOnFocus: false,
      // Keep displaying stale data on error to avoid UI flickering
      keepPreviousData: true
    }
  );

  return (
    <Layout
      title="Startup Call Management System | Supporting Entrepreneurs"
      description="A comprehensive platform for entrepreneurs to submit startup ideas, secure funding, and transform concepts into successful businesses."
    >
      {/* Hero Section */}
      <section className="relative bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block text-foreground xl:inline">Turn your ideas into</span>{' '}
                <span className="block text-primary xl:inline">successful startups</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                Our platform connects entrepreneurs with resources, funding, and expert guidance to transform innovative
                concepts into thriving businesses.
              </p>
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg">
                  <Link href="/submit">Submit Your Idea</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/startups">Browse Startups</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full overflow-hidden rounded-xl shadow-xl lg:h-[500px]">
                <div className="relative flex h-full w-full items-center justify-center">
                  <Image src="/images/im2.png" alt="Startup Call" fill className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest updates section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Latest Updates</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
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
                <Button variant="outline" className="mr-4">
                  All Events
                </Button>
              </Link>
              <Link href="/announcements">
                <Button variant="outline">
                  All Announcements
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to launch your startup
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Our platform provides end-to-end support for your entrepreneurial journey
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <CardTitle>Idea Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit your startup idea through our streamlined process with customizable templates and guidelines.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Expert Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get your startup idea evaluated by industry experts with comprehensive feedback and scoring.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Wallet className="h-6 w-6" />
                </div>
                <CardTitle>Funding Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with potential sponsors and investors looking to fund innovative startup ideas.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LineChart className="h-6 w-6" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your startup's progress with our comprehensive dashboard, milestone tracking, and analytics.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <CardTitle>Mentorship & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with mentors and industry experts who can provide guidance and support for your startup journey.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <CardTitle>Events Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stay updated with upcoming startup events, deadlines, and networking opportunities in your area.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 shadow-xl sm:px-12 sm:py-20 lg:px-20">
            <div className="relative">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to transform your idea into reality?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/90">
                  Join our platform today and connect with investors, mentors, and resources that can help bring your startup vision to life.
                </p>
              </div>
              <div className="mt-8 flex items-center justify-center space-x-4">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/auth/signup">Sign Up Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/about">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stay updated with startup opportunities
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Subscribe to our newsletter to receive the latest news, events, and funding opportunities.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md"
                />
                <Button className="w-full sm:w-auto">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
