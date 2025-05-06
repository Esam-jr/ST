import React, { ReactNode } from 'react';
import { LayoutDashboard, Users, Rocket, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Startups',
    href: '/admin/startups',
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    title: 'Startup Calls',
    href: '/admin/startup-calls',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: 'Sponsorship',
    href: '/admin/sponsorship-opportunities',
    icon: <DollarSign className="h-5 w-5" />,
  },
  // ... any other existing items
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    router.pathname.startsWith(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="pl-64 w-full">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 