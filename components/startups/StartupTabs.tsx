import React from 'react';
import StartupOverview from './tabs/StartupOverview';
import StartupReviews from './tabs/StartupReviews';
import StartupMilestones from './tabs/StartupMilestones';
import StartupTasks from './tabs/StartupTasks';
import StartupFinancials from './tabs/StartupFinancials';
import StartupTeam from './tabs/StartupTeam';
import StartupDocuments from './tabs/StartupDocuments';
import StartupDiscussion from './tabs/StartupDiscussion';

type StartupTabsProps = {
  startup: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
  userId?: string;
};

export default function StartupTabs({ 
  startup, 
  activeTab, 
  onTabChange, 
  userRole, 
  userId 
}: StartupTabsProps) {
  // Check if user is the founder of the startup
  const isFounder = userId === startup.founderId;
  
  // Check if user is an admin
  const isAdmin = userRole === 'ADMIN';
  
  // Check if user is a reviewer
  const isReviewer = userRole === 'REVIEWER';
  
  // Check if user is a sponsor
  const isSponsor = userRole === 'SPONSOR';

  // Determine which tabs to show based on permissions and startup status
  const availableTabs = [
    { id: 'overview', label: 'Overview', visible: true },
    { id: 'reviews', label: 'Reviews', visible: startup.status !== 'DRAFT' || isFounder || isAdmin },
    { id: 'milestones', label: 'Milestones', visible: startup.status === 'ACCEPTED' || isFounder || isAdmin },
    { id: 'tasks', label: 'Tasks', visible: startup.status === 'ACCEPTED' || isFounder || isAdmin },
    { id: 'financials', label: 'Financials', visible: (startup.status === 'ACCEPTED' && (isFounder || isAdmin || isSponsor)) },
    { id: 'team', label: 'Team', visible: startup.status !== 'DRAFT' || isFounder || isAdmin },
    { id: 'documents', label: 'Documents', visible: startup.status !== 'DRAFT' || isFounder || isAdmin },
    { id: 'discussion', label: 'Discussion', visible: startup.status !== 'DRAFT' }
  ];

  // Filter tabs based on visibility
  const visibleTabs = availableTabs.filter(tab => tab.visible);

  // Ensure activeTab is in visible tabs, otherwise default to overview
  if (!visibleTabs.some(tab => tab.id === activeTab)) {
    onTabChange('overview');
  }

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StartupOverview startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'reviews':
        return <StartupReviews startup={startup} isReviewer={isReviewer} isAdmin={isAdmin} userId={userId} />;
      case 'milestones':
        return <StartupMilestones startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'tasks':
        return <StartupTasks startup={startup} isFounder={isFounder} isAdmin={isAdmin} userId={userId} />;
      case 'financials':
        return <StartupFinancials startup={startup} isFounder={isFounder} isAdmin={isAdmin} isSponsor={isSponsor} />;
      case 'team':
        return <StartupTeam startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'documents':
        return <StartupDocuments startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'discussion':
        return <StartupDiscussion startup={startup} userId={userId} />;
      default:
        return <StartupOverview startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
    }
  };

  return (
    <div>
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
}
