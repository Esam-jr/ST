import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import AdvertisementManager from '@/components/admin/AdvertisementManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
        <AdvertisementManager />
      </div>
    </Layout>
  );
} 