import { NextApiRequest, NextApiResponse } from 'next';
// import prisma from '@/lib/prisma';

// Mock data for public startup calls
const mockCalls = [
  {
    id: '1',
    title: 'Green Technology Innovation Fund',
    description: 'Funding for startups working on sustainable technologies and renewable energy solutions.',
    status: 'PUBLISHED',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    publishedDate: new Date().toISOString(),
    industry: 'CleanTech',
    location: 'Global',
    fundingAmount: 'Up to $500,000',
    requirements: ['Early Stage', 'Sustainability Focus', 'Innovative Technology'],
    eligibilityCriteria: [
      'Startups must be legally registered entities',
      'Founding team must have at least 2 members',
      'Must have a working prototype or MVP',
      'Product or service must address environmental sustainability'
    ],
    selectionProcess: [
      'Initial application screening',
      'Technical assessment of product/solution',
      'Panel interview with industry experts'
    ],
    aboutSponsor: 'GreenTech Ventures is dedicated to supporting sustainable innovation worldwide.',
    applicationProcess: 'Apply through our online portal by the deadline. Selected startups will be notified within 2 weeks.'
  },
  {
    id: '2',
    title: 'HealthTech Accelerator Program',
    description: 'Supporting innovative healthcare startups with funding and mentorship.',
    status: 'PUBLISHED',
    applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    publishedDate: new Date().toISOString(),
    industry: 'Healthcare',
    location: 'Europe',
    fundingAmount: 'Up to $250,000',
    requirements: ['Seed Stage', 'Healthcare Innovation', 'Technical Team'],
    eligibilityCriteria: [
      'Must be focused on healthcare technology',
      'Team with healthcare and technical experience',
      'Incorporated in a European country'
    ],
    selectionProcess: [
      'Application review',
      'Pitch to investment committee',
      'Due diligence'
    ],
    aboutSponsor: 'MedInvest is a leading healthcare investment fund in Europe.',
    applicationProcess: 'Submit your application with pitch deck and team profiles.'
  },
  {
    id: '3',
    title: 'AI & Machine Learning Venture Fund',
    description: 'Investment fund for startups leveraging artificial intelligence and machine learning technologies.',
    status: 'PUBLISHED',
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    publishedDate: new Date().toISOString(),
    industry: 'Artificial Intelligence',
    location: 'Global',
    fundingAmount: 'Up to $1,000,000',
    requirements: ['AI/ML Focus', 'Proven Technology', 'Growth Stage'],
    eligibilityCriteria: [
      'Product must utilize AI/ML technologies',
      'Minimum viable product with active users',
      'Clear business model and growth metrics'
    ],
    selectionProcess: [
      'Application review',
      'Technical assessment',
      'Business model evaluation',
      'Final pitch'
    ],
    aboutSponsor: 'TechFund AI specializes in AI and ML investments globally.',
    applicationProcess: 'Submit detailed application with technical documentation.'
  },
  {
    id: '4',
    title: 'EdTech Innovation Challenge',
    description: 'Funding and support for startups transforming education through technology.',
    status: 'PUBLISHED',
    applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    publishedDate: new Date().toISOString(),
    industry: 'Education Technology',
    location: 'North America',
    fundingAmount: 'Up to $300,000',
    requirements: ['Education Focus', 'Technology Solution', 'Early Traction'],
    eligibilityCriteria: [
      'Technology solution for education sector',
      'Based in North America',
      'Minimum 3 months of operation with pilot users'
    ],
    selectionProcess: [
      'Initial screening',
      'Product demo',
      'Interview with education experts'
    ],
    aboutSponsor: 'EduInnovate Foundation supports technology transformation in education.',
    applicationProcess: 'Apply with a 5-minute video demo and business plan.'
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for this public endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // For now, just return mock data to avoid database connection issues
  // Later when database issues are resolved, we can add back database queries
  return res.status(200).json(mockCalls);
} 