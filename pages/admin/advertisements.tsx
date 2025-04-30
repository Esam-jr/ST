import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminAdvertisementsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/advertisements/');
  }, [router]);
  
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
} 