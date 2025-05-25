import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Building2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const navigation = [
  {
    name: "Overview",
    href: "/sponsor-dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    href: "/sponsor-dashboard/applications",
    icon: FileText,
  },
  {
    name: "Sponsored Startups",
    href: "/sponsor-dashboard/startups",
    icon: Building2,
  },
];

export default function SponsorSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between bg-card/50 rounded-lg border p-4">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
} 