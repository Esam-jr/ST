import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import EventCalendar from '@/components/admin/EventCalendar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <Layout title="Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }
  
  // Redirect if not authenticated or not an admin
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    if (typeof window !== 'undefined') {
      router.push('/auth/signin?callbackUrl=/admin/events');
    }
    return null;
  }
  
  return (
    <Layout title="Event Calendar">
      <div className="container mx-auto p-6">
        <EventCalendar view="list" showAddButton={true} />
      </div>
    </Layout>
  );
} 