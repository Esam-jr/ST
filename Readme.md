# Startup Call Management System

A production-ready fullstack web application designed to support entrepreneurs in submitting and managing startup ideas, engage sponsors, assign reviewers, track accepted projects, plan finances, and provide analytics for stakeholders.

## 🚀 Features

### Startup Call Management
- Promotion of startup launches through social media integration
- Events calendar for upcoming deadlines and startup events
- Automated notifications for important dates

### Sponsorship Management
- Preparation and distribution of sponsorship opportunities
- Dashboard for sponsors to track donations, returns, and sponsored startups
- Sponsor matching algorithm for startups

### Startup Idea Submission & Evaluation
- Comprehensive submission portal for entrepreneurs
- Customizable templates and guidelines for submission
- ML-assisted initial scoring and screening
- Automated reviewer assignment based on expertise/availability
- Structured feedback system for accepted and rejected applications

### Project Tracking
- Real-time dashboard for monitoring startup progress
- Milestone and timeline management tools
- Task assignment and completion tracking

### Financial Planning
- Budget planning and forecasting tools
- Real-time expenditure monitoring
- Financial analytics and reporting

### Communication & Collaboration
- Secure in-platform messaging system
- Discussion forums and boards
- Knowledge-sharing section with resources

### Result Announcement & Publicity
- Automated notification system for evaluation results
- Public showcase of accepted startups
- Integration with social media for announcements

### Reporting & Analytics
- Comprehensive analytics dashboard
- Custom report generation for stakeholders
- Trend analysis and insights

## 🛠️ Tech Stack

### Frontend
- Next.js (React framework with SSR)
- TypeScript for type safety
- Tailwind CSS for responsive design
- React Query for data fetching
- Chart.js for analytics visualization

### Backend
- Next.js API routes
- Prisma ORM for database operations
- PostgreSQL database

### Authentication
- NextAuth.js for secure authentication and authorization

### Deployment
- Vercel for production hosting
- GitHub Actions for CI/CD pipeline

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database

## 🚀 Getting Started

### Local Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/startup-call-management-system.git
cd startup-call-management-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/startup_call_management
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

4. Set up the database
```bash
npx prisma migrate dev
```

5. Run the development server
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

1. Push your code to GitHub

2. Connect your repository to Vercel

3. Set up the required environment variables in Vercel

4. Deploy your application

## 📁 Project Structure

```
├── components/         # Reusable UI components
├── context/           # React context for state management
├── lib/               # Utility functions and custom hooks
├── pages/             # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   └── ...            # Frontend pages
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── styles/            # Global styles and Tailwind configuration
├── types/             # TypeScript type definitions
├── .env.example       # Example environment variables
├── .eslintrc.json     # ESLint configuration
├── next.config.js     # Next.js configuration
├── package.json       # Project dependencies and scripts
├── README.md          # Project documentation
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## 🧪 Testing

Run tests with:

```bash
npm test
# or
yarn test
```

## 📝 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Authentication Flow](./docs/auth.md)

## 🔐 Security Measures

- JWT-based authentication
- RBAC (Role-Based Access Control)
- Input validation and sanitization
- CSRF protection
- Rate limiting for API endpoints
- Data encryption for sensitive information

## 🤝 Contributing

Contributions are welcome! Please check out our [contribution guidelines](./CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
