import { cn } from "@/lib/utils";
import { Home, ClipboardList, Settings } from "lucide-react";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showProjectManagement: boolean;
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  showProjectManagement,
}: DashboardSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <nav className="space-y-1">
        <button
          onClick={() => onTabChange("overview")}
          className={cn(
            "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md",
            activeTab === "overview"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Home className="mr-3 h-5 w-5" />
          Overview
        </button>

        {showProjectManagement && (
          <button
            onClick={() => onTabChange("project-management")}
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md",
              activeTab === "project-management"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <ClipboardList className="mr-3 h-5 w-5" />
            Project Management
          </button>
        )}

        <button
          onClick={() => onTabChange("settings")}
          className={cn(
            "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md",
            activeTab === "settings"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
      </nav>
    </div>
  );
}
