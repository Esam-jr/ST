# Database Documentation

## Schema Overview

The application uses PostgreSQL with Prisma ORM. The main schema is defined in `prisma/schema.prisma`.

### Core Entities

- **User**: Represents various user roles (Admin, Entrepreneur, Reviewer, Sponsor)
- **Startup**: Contains startup information submitted by entrepreneurs
- **StartupCall**: Represents funding opportunities published by admins
- **Budget**: Financial planning for startup calls
- **Review**: Evaluations of startups by reviewers

## Database Seeding

### Unified Seeding Process

A unified seeding process has been implemented to ensure consistent database initialization. This replaces the previous multiple seeding scripts.

To run the unified seed:

```bash
npm run prisma:unified-seed
```

This will:
1. Clear existing data
2. Create users with different roles
3. Create startups in various states
4. Create a startup call
5. Set up budget data with categories and expenses

### Legacy Seed Scripts

The following legacy seed scripts have been consolidated into the unified seed but are maintained for reference:

- `seed.ts`: Original seed script for basic entities
- `budget-seed.js`: Seeded budget-related data using Prisma queries
- `direct-seed.js`: Seeded data using direct PostgreSQL connections

## Migrations

Database migrations are stored in `prisma/migrations/`. The migration process is handled by Prisma's migration system.

To run migrations:

```bash
npx prisma migrate dev
```

## Database Connection

The application uses two connection strings:
- `DATABASE_URL`: Primary connection URL for Prisma
- `DIRECT_URL`: Direct connection URL for some operations

These should be configured in your environment variables.

## Entity Relationships

### User Relationships
- A User can create/own multiple Startups
- A User can create/manage multiple StartupCalls
- A User can submit multiple StartupCallApplications
- A User can create/manage multiple Budgets
- A User can create multiple Expenses

### Startup Relationships
- A Startup belongs to a User (founder)
- A Startup can have multiple Reviews
- A Startup can have multiple Milestones and Tasks
- A Startup can have multiple Sponsorships

### Budget Relationships
- A Budget belongs to a StartupCall
- A Budget can have multiple BudgetCategories
- A Budget can have multiple Expenses

## Data Validation

Validation is primarily handled at the application level, with some constraints enforced at the database level:
- Unique constraints (emails, etc.)
- Required fields
- Foreign key relationships

## Maintenance

### Database Backup
Regular automated backups should be configured in production.

### Database Optimization
For optimal performance:
- Ensure indexes are created on frequently queried fields
- Monitor query performance and optimize as needed
- Consider adding database-level optimizations for high-traffic tables 