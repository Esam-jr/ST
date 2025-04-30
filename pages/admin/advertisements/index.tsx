import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import AdvertisementManager from '@/components/admin/AdvertisementManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Calendar, FileText } from 'lucide-react';

export default function AdminAdvertisementsPage() {
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
      router.push('/auth/signin?callbackUrl=/admin/advertisements');
    }
    return null;
  }
  
  return (
    <Layout title="Advertisement Management">
      <div className="container mx-auto p-6">
        {/* Admin Navigation Tabs */}
        <div className="flex border-b mb-6">
          <Link href="/admin/events" className="mr-4 px-4 py-2 text-gray-600 hover:text-gray-900">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </div>
          </Link>
          <Link href="/admin/advertisements" className="mr-4 px-4 py-2 text-primary font-medium border-b-2 border-primary">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Advertisements
            </div>
          </Link>
        </div>
        
        <AdvertisementManager />
      </div>
    </Layout>
  );
} 