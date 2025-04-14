import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white shadow-inner dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">StartupCall</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supporting entrepreneurs in turning ideas into successful startups through expert guidance and funding.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary-600 dark:text-gray-400">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary-600 dark:text-gray-400">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/startups" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Browse Startups
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Submit Your Idea
                </Link>
              </li>
              <li>
                <Link href="/sponsors" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Become a Sponsor
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Upcoming Events
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/resources" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Startup Resources
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {currentYear} StartupCall Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
