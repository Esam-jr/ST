import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowRight, Users, Target, Lightbulb, Shield, BarChart, Heart } from 'lucide-react';

const CORE_VALUES = [
  {
    icon: Users,
    title: 'Community-Driven',
    description: 'Building a supportive ecosystem where entrepreneurs and sponsors can thrive together.',
  },
  {
    icon: Target,
    title: 'Innovation Focus',
    description: 'Championing groundbreaking ideas that have the potential to transform industries.',
  },
  {
    icon: Shield,
    title: 'Trust & Security',
    description: 'Ensuring a safe and transparent environment for all platform interactions.',
  },
  {
    icon: Lightbulb,
    title: 'Empowerment',
    description: 'Providing tools and resources that help turn innovative ideas into successful ventures.',
  },
  {
    icon: BarChart,
    title: 'Growth-Oriented',
    description: 'Supporting sustainable growth through meaningful connections and opportunities.',
  },
  {
    icon: Heart,
    title: 'Social Impact',
    description: 'Promoting ideas that create positive change in society and the environment.',
  },
];

const TEAM_MEMBERS = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Co-founder',
    bio: '15+ years experience in startup acceleration and venture capital.',
    image: '/team/sarah.jpg',
  },
  {
    name: 'Michael Chen',
    role: 'CTO & Co-founder',
    bio: 'Former tech lead at major tech companies, passionate about innovation.',
    image: '/team/michael.jpg',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Head of Operations',
    bio: 'Expert in scaling startup operations and building efficient processes.',
    image: '/team/elena.jpg',
  },
];

export default function AboutPage() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">
                Empowering the Next Generation of Startups
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                StartupTalent is more than a platform – we're a community dedicated to
                turning innovative ideas into successful ventures through meaningful
                connections and support.
              </p>
              <Button asChild size="lg">
                <Link href="/startups">
                  Explore Startups <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
              <div className="prose max-w-none">
                <p className="text-lg mb-4">
                  At StartupTalent, we believe that great ideas deserve the right support
                  to flourish. Our mission is to bridge the gap between innovative
                  entrepreneurs and forward-thinking sponsors, creating opportunities for
                  meaningful collaboration and growth.
                </p>
                <p className="text-lg mb-4">
                  We've built a platform that goes beyond simple matchmaking. We provide
                  a comprehensive ecosystem where startups can showcase their ideas,
                  receive valuable feedback, and connect with sponsors who share their
                  vision for the future.
                </p>
                <p className="text-lg">
                  Through our structured approach to startup development and sponsorship,
                  we're helping shape the future of innovation while ensuring that great
                  ideas get the support they need to succeed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Core Values Section */}
        <section className="py-16 bg-muted/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CORE_VALUES.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <Separator />

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {TEAM_MEMBERS.map((member, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                      <p className="text-primary mb-2">{member.role}</p>
                      <p className="text-muted-foreground">{member.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Join Our Community?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're an entrepreneur with a groundbreaking idea or a sponsor
                looking to support innovation, we'd love to have you as part of our
                community.
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
} 