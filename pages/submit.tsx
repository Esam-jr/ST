import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';

// Industry options for the dropdown
const INDUSTRY_OPTIONS = [
  'AgTech',
  'AI',
  'Blockchain',
  'CleanTech',
  'EdTech',
  'E-commerce',
  'FinTech',
  'HealthTech',
  'IoT',
  'Manufacturing',
  'SaaS',
  'Security',
  'Social Media',
  'Sustainability',
  'VR/AR',
  'Other'
];

// Startup stages
const STAGE_OPTIONS = [
  'Idea',
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Growth'
];

export default function SubmitStartup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [startupName, setStartupName] = useState('');
  const [description, setDescription] = useState('');
  const [pitch, setPitch] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [stage, setStage] = useState('Idea');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  
  // Handle industry selection
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    } else {
      if (selectedIndustries.length < 3) {
        setSelectedIndustries([...selectedIndustries, industry]);
      }
    }
  };

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/submit');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    
    // Validate form
    if (!startupName || !description || !pitch || selectedIndustries.length === 0 || !stage) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // In a real app, you would submit this data to an API endpoint
      // For now, we'll just simulate a successful submission
      
      // Construct form data (for file upload)
      const formData = new FormData();
      formData.append('name', startupName);
      formData.append('description', description);
      formData.append('pitch', pitch);
      formData.append('industry', JSON.stringify(selectedIndustries));
      formData.append('stage', stage);
      formData.append('website', website);
      if (logo) {
        formData.append('logo', logo);
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setStartupName('');
      setDescription('');
      setPitch('');
      setSelectedIndustries([]);
      setStage('Idea');
      setWebsite('');
      setLogo(null);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('An error occurred while submitting your startup. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <Layout title="Submit Startup | Loading">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600 mx-auto"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Loading...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/submit');
    return null;
  }

  return (
    <Layout title="Submit Your Startup | Startup Call Management System">
      <div className="bg-gray-50 py-12 dark:bg-gray-900 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Submit Your Startup
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Share your innovative idea with our community of investors, mentors, and entrepreneurs.
            </p>
          </div>

          <div className="mt-12">
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
              {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Your startup has been submitted successfully!
                      </h3>
                      <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                        Redirecting you to your dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Startup Name */}
                <div>
                  <label htmlFor="startup-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Startup Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="startup-name"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A brief one-sentence description of your startup"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                      maxLength={180}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {description.length}/180 characters
                  </p>
                </div>

                {/* Pitch */}
                <div>
                  <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Elevator Pitch <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="pitch"
                      rows={6}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      placeholder="Describe your startup in detail. What problem are you solving? What is your solution? Who is your target market? What is your business model?"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Industry <span className="text-red-500">*</span> (Select up to 3)
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => toggleIndustry(industry)}
                        className={`rounded-full px-3 py-1 text-sm ${
                          selectedIndustries.includes(industry)
                            ? 'bg-primary-100 text-primary-800 ring-1 ring-primary-600 dark:bg-primary-900 dark:text-primary-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                  {selectedIndustries.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">Please select at least one industry</p>
                  )}
                </div>

                {/* Stage */}
                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="stage"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      required
                    >
                      {STAGE_OPTIONS.map((stageOption) => (
                        <option key={stageOption} value={stageOption}>
                          {stageOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Logo (Optional)
                  </label>
                  <div className="mt-1 flex items-center">
                    {logo ? (
                      <div className="relative h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700">
                        <img
                          src={URL.createObjectURL(logo)}
                          alt="Startup logo preview"
                          className="h-full w-full rounded-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setLogo(null)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="logo-upload"
                        className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-100 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      >
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <input id="logo-upload" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                      </label>
                    )}
                    <p className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                      Upload a square logo image (PNG, JPG) up to 2MB
                    </p>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                        terms and conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                        privacy policy
                      </a>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-primary-300 dark:disabled:bg-primary-800"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Startup'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
