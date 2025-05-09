# Codebase Cleanup Actions

1. Removed backup files:

   - Deleted pages/index.tsx.bak

2. Organized utility scripts:

   - Created scripts/database directory for database-related scripts
   - Created scripts/migrations directory for migration scripts
   - Created scripts/utils directory for general utility scripts
   - Created scripts/deprecated directory for deprecated code

3. Moved files:

   - Relocated check-\*.js database scripts to scripts/database/
   - Relocated query-db.js and checkSponsorship.js to scripts/database/
   - Relocated migration scripts to scripts/migrations/
   - Moved temp-schema.prisma to scripts/database/temp-schema.prisma.bak
   - Moved duplicated BudgetExpenses.tsx to scripts/deprecated/components/

4. Updated API endpoints:

   - Added deprecation notice to /api/startup-calls/public.ts
   - Updated client code to use the main API with appropriate filters

5. Removed unnecessary files:
   - Deleted test.sql with SQL typo

# Recommendations for Further Cleanup

1. Large files that may need refactoring:

   - pages/startup-calls/[id]/apply.tsx (1128 lines)
   - pages/admin/sponsorship-opportunities/[id]/index.tsx (999 lines)
   - components/admin/AdvertisementManager.tsx (905 lines)

2. Duplicate environment files:

   - Consider consolidating .env and .env.local by using a template approach

3. Database scripts:

   - There are multiple seed files (seed.ts, budget-seed.ts, etc.) - consider unifying them

4. Code quality improvements:

   - Add consistent error handling across API routes
   - Standardize component prop types for better consistency
   - Extract common UI patterns into reusable components

5. Performance optimization:

   - Use React.memo for performance-critical components
   - Optimize data fetching with SWR's caching capabilities
   - Consider server-side rendering for data-heavy pages

6. Technical debt:
   - Remove all TODO comments (found several in the codebase)
   - Complete and finalize any migration files
   - Ensure consistent naming conventions across the codebase
