import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/layout/Layout';

export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <Layout
      title="Startup Call Management System | Supporting Entrepreneurs"
      description="A comprehensive platform for entrepreneurs to submit startup ideas, secure funding, and transform concepts into successful businesses."
    >
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Turn your ideas into</span>{' '}
                <span className="block text-primary-600 xl:inline">successful startups</span>
              </h1>
              <p className="mt-3 max-w-md text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                Our platform connects entrepreneurs with resources, funding, and expert guidance to transform innovative
                concepts into thriving businesses.
              </p>
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link
                  href="/submit"
                  className="rounded-md bg-primary-600 px-8 py-3 text-center text-base font-medium text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:px-10"
                >
                  Submit Your Idea
                </Link>
                <Link
                  href="/startups"
                  className="rounded-md border border-gray-300 bg-white px-8 py-3 text-center text-base font-medium text-gray-700 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:px-10"
                >
                  Browse Startups
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full overflow-hidden rounded-xl shadow-xl lg:h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-600 opacity-20"></div>
                <div className="relative h-full w-full">
                  {/* Use a placeholder image - in production, replace with your actual image */}
                  <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <svg
                      className="h-24 w-24 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 dark:bg-gray-800 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to launch your startup
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Our platform provides end-to-end support for your entrepreneurial journey
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Idea Submission</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Submit your startup idea through our streamlined process with customizable templates and guidelines.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Expert Evaluation</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Get your startup idea evaluated by industry experts with comprehensive feedback and scoring.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Funding Opportunities</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Connect with potential sponsors and investors looking to fund innovative startup ideas.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Progress Tracking</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Track your startup's progress with our comprehensive dashboard, milestone tracking, and analytics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Mentorship & Support</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Connect with mentors and industry experts who can provide guidance and support for your startup journey.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Events & Networking</h3>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Participate in exclusive events, workshops, and networking opportunities to grow your startup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white py-16 dark:bg-gray-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Trusted by entrepreneurs worldwide
            </h2>
            <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
              Our platform has helped thousands of entrepreneurs turn their ideas into successful startups
            </p>
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 rounded-lg bg-gray-50 p-8 shadow-lg dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary-600">2,500+</span>
                <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">Startup Ideas Submitted</p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-bold text-primary-600">500+</span>
                <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">Startups Funded</p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-bold text-primary-600">$25M+</span>
                <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">Total Funding Secured</p>
              </div>
              <div className="text-center">
                <span className="text-4xl font-bold text-primary-600">98%</span>
                <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">Entrepreneur Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-700 py-16 dark:bg-primary-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to turn your idea into a successful startup?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-primary-100">
              Join thousands of entrepreneurs who have successfully launched their startups with our platform.
            </p>
            <div className="mt-10">
              <form className="sm:mx-auto sm:max-w-xl lg:mx-0">
                <div className="sm:flex">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="block w-full rounded-md border-0 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      type="submit"
                      className="block w-full rounded-md bg-white px-4 py-3 font-medium text-primary-700 shadow hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 sm:px-10"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-16 dark:bg-gray-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Hear from our successful entrepreneurs
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Our platform has helped countless entrepreneurs turn their ideas into thriving businesses
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="flex flex-col rounded-lg shadow-lg">
              <div className="flex flex-1 flex-col justify-between rounded-lg bg-white p-8 dark:bg-gray-800">
                <div className="flex items-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-medium text-gray-500">JS</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Jessica Smith</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Founder, EcoTech Solutions</p>
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  <p className="text-gray-500 dark:text-gray-400">
                    "The Startup Call Management System was instrumental in helping me refine my business idea and secure
                    seed funding. The mentor feedback was invaluable and the platform's tools made tracking our progress
                    so much easier."
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="flex flex-col rounded-lg shadow-lg">
              <div className="flex flex-1 flex-col justify-between rounded-lg bg-white p-8 dark:bg-gray-800">
                <div className="flex items-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-medium text-gray-500">MT</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Michael Thomas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">CEO, HealthTech Innovations</p>
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  <p className="text-gray-500 dark:text-gray-400">
                    "As a first-time founder, I didn't know where to start. This platform guided me through every step
                    of the startup journey, from refining my idea to connecting with investors. We're now in our Series A
                    round thanks to the connections made here."
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="flex flex-col rounded-lg shadow-lg">
              <div className="flex flex-1 flex-col justify-between rounded-lg bg-white p-8 dark:bg-gray-800">
                <div className="flex items-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-medium text-gray-500">AJ</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ava Johnson</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Founder, EdTech Pioneers</p>
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  <p className="text-gray-500 dark:text-gray-400">
                    "The review process was thorough and provided actionable feedback that helped us pivot our business
                    model. The financial planning tools were especially helpful in managing our runway efficiently. I
                    highly recommend this platform to any serious entrepreneur."
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${i === 4 ? 'text-gray-300 dark:text-gray-600' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
