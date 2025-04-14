import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

type RoleSelectionCheckerProps = {
  children: React.ReactNode;
};

export default function RoleSelectionChecker({ children }: RoleSelectionCheckerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Don't perform any redirects on the role selection page itself
  const isRoleSelectionPage = router.pathname === '/auth/role-selection';
  // Don't perform redirects on auth pages
  const isAuthPage = router.pathname.startsWith('/auth/');
  
  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user?.role === 'USER' &&
      !isRoleSelectionPage &&
      !isAuthPage
    ) {
      // Store the current URL as the callback URL
      const callbackUrl = router.asPath !== '/' ? router.asPath : '/dashboard';
      router.push(`/auth/role-selection?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, session, router, isRoleSelectionPage, isAuthPage]);
  
  return <>{children}</>;
} 