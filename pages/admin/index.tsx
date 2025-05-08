"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  BarChart,
  PieChart,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  Bell,
  Award,
  ClipboardList,
  Settings,
  PlusCircle,
  ChevronRight,
  Home,
  Menu,
  X,
  LogOut,
  ArrowRight,
  Calculator,
} from "lucide-react";
import AdminSystemOverview from "@/components/admin/AdminSystemOverview";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminStartupCalls from "@/components/admin/AdminStartupCalls";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminFinancials from "@/components/admin/AdminFinancials";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminReports from "@/components/admin/AdminReports";
import AdminNotificationManagement from "@/components/admin/AdminNotificationManagement";
import AdminReviewerManagement from "@/components/admin/AdminReviewerManagement";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/admin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Set active section based on query parameter
  useEffect(() => {
    if (router.query.section && typeof router.query.section === "string") {
      const section = router.query.section;
      if (
        [
          "overview",
          "startup-calls",
          "users",
          "reviews",
          "financials",
          "notifications",
          "reports",
          "settings",
          "reviewer-management",
          "sponsorship-opportunities",
          "budget-management",
        ].includes(section)
      ) {
        setActiveSection(section);
      }
    }
  }, [router.query.section]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (status === "loading") {
    return (
      <Layout title="Loading | Admin Dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null; // Will redirect in the useEffect
  }

  // Menu items for the sidebar
  const menuItems = [
    { id: "overview", label: "Overview", icon: <Home className="h-5 w-5" /> },
    {
      id: "startup-calls",
      label: "Startup Calls",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      id: "sponsorship-opportunities",
      label: "Sponsorship Opportunities",
      icon: <DollarSign className="h-5 w-5" />,
    },
    { id: "events", label: "Events", icon: <Calendar className="h-5 w-5" /> },
    {
      id: "users",
      label: "Users & Roles",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "reviewer-management",
      label: "Reviewer Management",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      id: "financials",
      label: "Financials",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: "budget-management",
      label: "Budget Management",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    { id: "reports", label: "Reports", icon: <FileText className="h-5 w-5" /> },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <>
            <div className="mb-8">
              <AdminSystemOverview />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <AdminQuickActions />
              </div>
              <div className="md:col-span-1">
                <AdminRecentActivity />
              </div>
            </div>
          </>
        );
      case "startup-calls":
        return <AdminStartupCalls />;
      case "sponsorship-opportunities":
        return (
          <iframe
            src="/admin/sponsorship-opportunities"
            className="w-full h-[calc(100vh-8rem)] border-none"
          />
        );
      case "events":
        return (
          <iframe
            src="/admin/events"
            className="w-full h-[calc(100vh-8rem)] border-none"
          />
        );
      case "advertisements":
        return (
          <iframe
            src="/admin/advertisements"
            className="w-full h-[calc(100vh-8rem)] border-none"
          />
        );
      case "users":
        return <AdminUserManagement />;
      case "reviewer-management":
        return <AdminReviewerManagement />;
      case "reviews":
        return <AdminReviews />;
      case "financials":
        return <AdminFinancials />;
      case "notifications":
        return <AdminNotificationManagement />;
      case "reports":
        return <AdminReports />;
      case "settings":
        return <AdminSettings />;
      case "budget-management":
        return (
          <iframe
            src="/admin/startup-calls/budgets"
            className="w-full h-[calc(100vh-8rem)] border-none"
          />
        );
      default:
        return <AdminSystemOverview />;
    }
  };

  return (
    <Layout title="Admin Dashboard | Startup Call Management System">
      <div className="flex h-screen bg-background">
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-20 w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen overflow-y-auto`}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg">Admin Dashboard</h2>
            <button
              className="lg:hidden p-1 rounded-md hover:bg-muted"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {session.user.name?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-medium">{session.user.name}</p>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary text-xs"
                >
                  Administrator
                </Badge>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 mt-auto border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <header className="bg-card/80 backdrop-blur-sm shadow sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="mr-4 p-2 rounded-md hover:bg-muted lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">
                  {menuItems.find((item) => item.id === activeSection)?.label ||
                    "Overview"}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSection("notifications")}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  <span className="sr-only sm:not-sr-only">Notifications</span>
                </Button>
              </div>
            </div>
          </header>

          <div className="p-6 h-[calc(100%-4rem)] overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
}
