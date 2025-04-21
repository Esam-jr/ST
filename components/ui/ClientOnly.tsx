import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component renders children only on the client-side
 * This helps avoid useLayoutEffect warnings during server-side rendering
 * 
 * Usage:
 * <ClientOnly>
 *   <ComponentWithUseLayoutEffect />
 * </ClientOnly>
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  // Run once on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return fallback on server, children on client
  return isClient ? <>{children}</> : <>{fallback}</>;
} 