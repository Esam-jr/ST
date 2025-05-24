import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  hideNav?: boolean;
};

export default function Layout({
  children,
  title = 'Startup Call Management System',
  description = 'A platform for managing startup calls, submissions, reviews, and funding',
  hideNav,
}: LayoutProps) {
  const router = useRouter();
  
  // Check if current path is an admin path
  const isAdminPage = router.pathname.startsWith('/admin');
  
  // Hide navbar and footer on admin pages
  const shouldHideNav = hideNav || isAdminPage;

  const pageTitle = title ? `${title} | Startup Tools` : 'Startup Tools';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="fixed inset-0 w-full h-full overflow-hidden">
          <div className="grid-bg-pattern" />
        </div>
        {!shouldHideNav && <Navbar />}
        <main className={`flex-grow relative z-10 ${shouldHideNav ? 'pt-0' : ''}`}>{children}</main>
        {!shouldHideNav && <Footer />}
      </div>
    </>
  );
}
