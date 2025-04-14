import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the user is authenticated
  const token = await getToken({ req: request });

  // Define protected paths and required roles
  const authRequiredPaths = [
    '/dashboard',
    '/profile',
    '/submit',
    '/startups',
    '/reviews',
    '/sponsorships'
  ];
  
  // Admin-only paths
  const adminPaths = [
    '/admin',
  ];

  // Reviewer-only paths
  const reviewerPaths = [
    '/reviews/assign',
    '/reviews/pending',
  ];

  // Sponsor-only paths
  const sponsorPaths = [
    '/sponsorships/manage',
  ];

  // Check if the current path is protected
  const isAuthRequired = authRequiredPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the current path is admin-only
  const isAdminPath = adminPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the current path is reviewer-only
  const isReviewerPath = reviewerPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the current path is sponsor-only
  const isSponsorPath = sponsorPaths.some(path => 
    pathname.startsWith(path)
  );

  // If it's an auth path and user isn't authenticated, redirect to login
  if (isAuthRequired && !token) {
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Handle role-based access for specific paths
  if (token) {
    const userRole = token.role as string;

    // Redirect admin paths for non-admin users
    if (isAdminPath && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect reviewer paths for non-reviewers
    if (isReviewerPath && userRole !== 'REVIEWER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect sponsor paths for non-sponsors
    if (isSponsorPath && userRole !== 'SPONSOR' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect to appropriate dashboard when accessing /dashboard
    if (pathname === '/dashboard') {
      // No need to redirect if we're already at the right dashboard
      // This will use the default dashboard layout with role-specific content
    }
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and auth paths
    '/((?!_next/static|_next/image|favicon.ico|api/(?!auth/callback)).*)',
  ],
}; 