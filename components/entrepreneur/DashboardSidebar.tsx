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
    <div className="w-64 flex-shrink-0">
      <nav className="space-y-1">
        <Button
          variant={activeView === "overview" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveView("overview")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={activeView === "applications" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveView("applications")}
        >
          <FileText className="mr-2 h-4 w-4" />
          My Applications
        </Button>
        <Button
          variant={activeView === "opportunities" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveView("opportunities")}
        >
          <Target className="mr-2 h-4 w-4" />
          Opportunities
        </Button>
        {hasActiveProject && (
          <Button
            variant={activeView === "project-management" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("project-management")}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Project Management
          </Button>
        )}
      </nav>
    </div>
  );
}
