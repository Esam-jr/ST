import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/router';
import StartupOverview from './tabs/StartupOverview';
import StartupMilestones from './tabs/StartupMilestones';
import StartupFinancials from './tabs/StartupFinancials';
import StartupDocuments from './tabs/StartupDocuments';
import StartupTeam from './tabs/StartupTeam';
import StartupReviews from './tabs/StartupReviews';

type StartupTabsProps = {
  startup: any;
  isFounder: boolean;
  isAdmin: boolean;
  isReviewer: boolean;
  userId: string;
};

export default function StartupTabs({ startup, isFounder, isAdmin, isReviewer, userId }: StartupTabsProps) {
  const router = useRouter();
  const currentTab = typeof router.query.tab === 'string' ? router.query.tab : undefined;

  // Define available tabs and their visibility conditions
  const tabs = [
    { id: 'overview', label: 'Overview', visible: true },
    { id: 'milestones', label: 'Milestones', visible: startup.status === 'ACCEPTED' || isFounder || isAdmin },
    { id: 'financials', label: 'Financials', visible: startup.status === 'ACCEPTED' || isFounder || isAdmin },
    { id: 'documents', label: 'Documents', visible: true },
    { id: 'team', label: 'Team', visible: startup.status === 'ACCEPTED' || isFounder || isAdmin },
    { id: 'reviews', label: 'Reviews', visible: isAdmin || isReviewer },
  ];

  // Filter visible tabs
  const visibleTabs = tabs.filter(t => t.visible);

  // Set default tab if none selected
  const defaultTab = currentTab || visibleTabs[0]?.id || 'overview';

  // Handle tab change
  const handleTabChange = (value: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: value },
    });
  };

  // Render tab content based on selected tab
  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'overview':
        return <StartupOverview startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'milestones':
        return <StartupMilestones startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'financials':
        return <StartupFinancials startup={startup} isFounder={isFounder} isAdmin={isAdmin} isSponsor={false} />;
      case 'documents':
        return <StartupDocuments startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'team':
        return <StartupTeam startup={startup} isFounder={isFounder} isAdmin={isAdmin} />;
      case 'reviews':
        return <StartupReviews startup={startup} isReviewer={isReviewer} isAdmin={isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="text-center">
              {tab.label}
          </TabsTrigger>
          ))}
      </TabsList>
      {visibleTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {renderTabContent(tab.id)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
