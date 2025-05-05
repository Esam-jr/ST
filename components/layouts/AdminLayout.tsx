import { LayoutDashboard, Users, Rocket, FileText, DollarSign } from 'lucide-react';

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