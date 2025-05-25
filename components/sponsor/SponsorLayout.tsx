import { ReactNode } from "react";
import Layout from "@/components/layout/Layout";
import SponsorSidebar from "./SponsorSidebar";

interface SponsorLayoutProps {
  children: ReactNode;
}

export default function SponsorLayout({ children }: SponsorLayoutProps) {
  return (
    <Layout>
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Sponsor Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your sponsorships and track startup progress
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-[92px]">
                <SponsorSidebar />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 