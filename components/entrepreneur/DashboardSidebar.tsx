import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Target,
  Briefcase,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

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
        <h2 className="text-muted-foreground font-medium mb-4 px-3">
          Navigation
        </h2>
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
            Applications
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
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center px-3">
                  <div className="w-full border-t border-muted"></div>
                </div>
              </div>

              <div className="px-3 py-1">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Approved Startup</span>
                </div>
              </div>

              <Button
                variant={
                  activeView === "project-management" ? "default" : "ghost"
                }
                className={`w-full justify-start ${
                  activeView === "project-management"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted border border-green-200 bg-green-50 text-green-700"
                }`}
                onClick={() => setActiveView("project-management")}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Project Management
              </Button>
            </>
          )}

          <Button
            variant={activeView === "ideas" ? "default" : "ghost"}
            className={`w-full justify-start ${
              activeView === "ideas"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveView("ideas")}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            My Ideas
          </Button>
        </nav>
      </div>
    </div>
  );
}
