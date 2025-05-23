"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import NotificationDropdown from '@/components/ui/NotificationDropdown';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  
  
    // Determine the appropriate dashboard link based on the user's role
    const getDashboardLink = () => {
      if (session?.user?.role === 'ENTREPRENEUR') {
        return '/entrepreneur-dashboard';
      } else if (session?.user?.role === 'SPONSOR') {
        return '/sponsor-dashboard';
      } else if (session?.user?.role === 'REVIEWER') {
        return '/reviewer-dashboard'; 
      } else if (session?.user?.role === 'ADMIN') {
        return '/admin'; 
      } else {
        return '/';
      }
    };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">StartupCall</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  router.pathname === '/'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Home
              </Link>
              <Link
                href="/startup-calls"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  router.pathname.startsWith('/startup-calls')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Startup Calls
              </Link>
              <Link
                href="/startups"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  router.pathname.startsWith('/startups')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Startups
              </Link>
              <Link
                href="/sponsorship-opportunities"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  router.pathname.startsWith('/sponsorship-opportunities')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Sponsor Call
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    router.pathname.startsWith('/admin')
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/events"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  router.pathname.startsWith('/events')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Events
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {session ? (
              <>
                <NotificationDropdown />
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User'} />
                          <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {session.user?.name && <p className="font-medium">{session.user.name}</p>}
                          {session.user?.email && (
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                              {session.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href={getDashboardLink()} className="w-full">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/profile" className="w-full">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="cursor-pointer"
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="hidden space-x-2 sm:flex">
                <Link href="/auth/signin">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="flex items-center">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="/"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                router.pathname === '/'
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href="/startup-calls"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                router.pathname.startsWith('/startup-calls')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Startup Calls
            </Link>
            <Link
              href="/startups"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                router.pathname.startsWith('/startups')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Startups
            </Link>
            <Link
              href="/sponsorship-opportunities"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                router.pathname.startsWith('/sponsorship-opportunities')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Sponsor Call
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  router.pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              href="/events"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                router.pathname.startsWith('/events')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Events
            </Link>
            
            {session ? (
              <>
                <div className="my-2 border-t border-border pt-2"></div>
                <Link
                  href={getDashboardLink()} 
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-4 flex flex-col space-y-2 px-3">
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full justify-center">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full justify-center">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
