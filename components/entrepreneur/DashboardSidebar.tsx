import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Target, Briefcase } from "lucide-react";

interface DashboardSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  hasActiveProject: boolean;
}

export default function DashboardSidebar({
  activeView,
  setActiveView,
  hasActiveProject,
}: DashboardSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-24 py-4 pr-4">
        <nav className="space-y-2">
          <Button
            variant={activeView === "overview" ? "default" : "ghost"}
            className={`w-full justify-start ${
              activeView === "overview"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveView("overview")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeView === "applications" ? "default" : "ghost"}
            className={`w-full justify-start ${
              activeView === "applications"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveView("applications")}
          >
            <FileText className="mr-2 h-4 w-4" />
            My Applications
          </Button>
          <Button
            variant={activeView === "opportunities" ? "default" : "ghost"}
            className={`w-full justify-start ${
              activeView === "opportunities"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveView("opportunities")}
          >
            <Target className="mr-2 h-4 w-4" />
            Opportunities
          </Button>
          {hasActiveProject && (
            <Button
              variant={
                activeView === "project-management" ? "default" : "ghost"
              }
              className={`w-full justify-start ${
                activeView === "project-management"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setActiveView("project-management")}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Project Management
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
}
