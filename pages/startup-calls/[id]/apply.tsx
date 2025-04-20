import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define the application form data structure
interface ApplicationFormData {
  startupName: string;
  website: string;
  foundingDate: string;
  teamSize: string;
  industry: string;
  stage: string;
  description: string;
  problem: string;
  solution: string;
  traction: string;
  businessModel: string;
  funding: string;
  useOfFunds: string;
  competitiveAdvantage: string;
  founderBio: string;
  pitchDeck: File | null;
  financials: File | null;
  termsAgreed: boolean;
}

// Call data type
interface StartupCall {
  id: string;
  title: string;
  applicationDeadline: Date;
  industry: string;
}

export default function ApplyForCall() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [call, setCall] = useState<StartupCall | null>(null);

  // Form setup with react-hook-form
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ApplicationFormData>({
    defaultValues: {
      startupName: '',
      website: '',
      foundingDate: '',
      teamSize: '',
      industry: '',
      stage: '',
      description: '',
      problem: '',
      solution: '',
      traction: '',
      businessModel: '',
      funding: '',
      useOfFunds: '',
      competitiveAdvantage: '',
      founderBio: '',
      pitchDeck: null,
      financials: null,
      termsAgreed: false
    }
  });
  
  const termsAgreed = watch('termsAgreed');

  // Mock data fetching for the call
  useEffect(() => {
    if (!id) return;

    const fetchStartupCall = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/startup-calls/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setCall(null);
          } else if (response.status === 401) {
            router.push(`/auth/signin?callbackUrl=/startup-calls/${id}/apply`);
          } else {
            throw new Error(`Error: ${response.status}`);
          }
          return;
        }
        
        const data = await response.json();
        setCall(data);
      } catch (error) {
        console.error('Error fetching startup call:', error);
        setCall(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStartupCall();
  }, [id, router]);

  // Redirect if not authenticated or not an entrepreneur
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/startup-calls/${id}/apply`);
    } else if (status === 'authenticated' && session?.user?.role !== 'ENTREPRENEUR') {
      router.push('/dashboard');
    }
  }, [status, session, router, id]);

  // Handle form submission
  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true);
    setSubmitError('');
    
    try {
      // Prepare data for submission
      const formData = {
        startupName: data.startupName,
        website: data.website,
        foundingDate: data.foundingDate,
        teamSize: data.teamSize,
        industry: data.industry,
        stage: data.stage,
        description: data.description,
        problem: data.problem,
        solution: data.solution,
        traction: data.traction,
        businessModel: data.businessModel,
        funding: data.funding,
        useOfFunds: data.useOfFunds,
        competitiveAdvantage: data.competitiveAdvantage,
        founderBio: data.founderBio,
        // In a real implementation, you would upload files to storage
        // and use the returned URLs here
        pitchDeckUrl: data.pitchDeck ? 'mock-pitch-deck-url.pdf' : null,
        financialsUrl: data.financials ? 'mock-financials-url.xlsx' : null
      };
      
      // Submit application to API
      const response = await fetch(`/api/startup-calls/${id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }
      
      setSubmitSuccess(true);
      
      // Redirect after success (with a delay for user feedback)
      setTimeout(() => {
        router.push('/startup-calls');
      }, 3000);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit your application. Please try again.');
      console.error('Application submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Apply for Startup Call | Loading">
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!call) {
    return (
      <Layout title="Startup Call Not Found">
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Call Not Found</h1>
          <p className="mt-2 text-muted-foreground">The startup call you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => router.push('/startup-calls')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Calls
          </Button>
        </div>
      </Layout>
    );
  }

  if (submitSuccess) {
    return (
      <Layout title="Application Submitted | Success">
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-center">Application Submitted!</CardTitle>
              <CardDescription className="text-center">
                Your application has been successfully submitted for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                We've received your application for {call.title}. You will receive a confirmation email shortly, and we'll notify you of any updates to your application status.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => router.push('/startup-calls')}>
                Return to Startup Calls
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Apply for ${call.title}`}>
      <div className="min-h-screen bg-muted/10">
        <header className="bg-card/80 backdrop-blur-sm shadow">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 -ml-2 text-sm text-muted-foreground"
              onClick={() => router.push(`/startup-calls/${id}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to call details
            </Button>
                
            <h1 className="text-2xl font-bold tracking-tight">Apply for {call.title}</h1>
            <p className="text-muted-foreground mt-1">
              Complete the form below to submit your application
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {submitError && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Startup Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Startup Information</CardTitle>
                <CardDescription>
                  Tell us about your startup and the team behind it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startupName">Startup Name *</Label>
                    <Input 
                      id="startupName"
                      {...register('startupName', { required: 'Startup name is required' })}
                      placeholder="Your startup name"
                    />
                    {errors.startupName && (
                      <p className="text-sm text-red-500">{errors.startupName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website"
                      {...register('website')}
                      placeholder="https://your-startup.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="foundingDate">Founding Date *</Label>
                    <Input 
                      id="foundingDate"
                      type="date"
                      {...register('foundingDate', { required: 'Founding date is required' })}
                    />
                    {errors.foundingDate && (
                      <p className="text-sm text-red-500">{errors.foundingDate.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size *</Label>
                    <Select onValueChange={(value) => register('teamSize').onChange({ target: { value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5 members</SelectItem>
                        <SelectItem value="6-10">6-10 members</SelectItem>
                        <SelectItem value="11-20">11-20 members</SelectItem>
                        <SelectItem value="21-50">21-50 members</SelectItem>
                        <SelectItem value="50+">50+ members</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.teamSize && (
                      <p className="text-sm text-red-500">{errors.teamSize.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select 
                      defaultValue={call.industry} 
                      onValueChange={(value) => register('industry').onChange({ target: { value } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Energy">Energy</SelectItem>
                        <SelectItem value="Fintech">Fintech</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-sm text-red-500">{errors.industry.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stage">Startup Stage *</Label>
                    <Select onValueChange={(value) => register('stage').onChange({ target: { value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea Stage</SelectItem>
                        <SelectItem value="prototype">Prototype</SelectItem>
                        <SelectItem value="mvp">MVP</SelectItem>
                        <SelectItem value="early_revenue">Early Revenue</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="scaling">Scaling</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.stage && (
                      <p className="text-sm text-red-500">{errors.stage.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Startup Description *</Label>
                  <Textarea 
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="Provide a brief description of your startup (max 500 words)"
                    rows={5}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product and Market Section */}
            <Card>
              <CardHeader>
                <CardTitle>Product and Market</CardTitle>
                <CardDescription>
                  Tell us about your product or service and the market opportunity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Statement *</Label>
                  <Textarea 
                    id="problem"
                    {...register('problem', { required: 'Problem statement is required' })}
                    placeholder="What problem are you solving? (max 300 words)"
                    rows={4}
                  />
                  {errors.problem && (
                    <p className="text-sm text-red-500">{errors.problem.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">Your Solution *</Label>
                  <Textarea 
                    id="solution"
                    {...register('solution', { required: 'Solution description is required' })}
                    placeholder="How does your product or service solve this problem? (max 300 words)"
                    rows={4}
                  />
                  {errors.solution && (
                    <p className="text-sm text-red-500">{errors.solution.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="traction">Traction and Metrics</Label>
                  <Textarea 
                    id="traction"
                    {...register('traction')}
                    placeholder="Share any traction metrics, user growth, or milestones achieved (max 200 words)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model *</Label>
                  <Textarea 
                    id="businessModel"
                    {...register('businessModel', { required: 'Business model is required' })}
                    placeholder="Explain your business model and revenue streams (max 200 words)"
                    rows={3}
                  />
                  {errors.businessModel && (
                    <p className="text-sm text-red-500">{errors.businessModel.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitiveAdvantage">Competitive Advantage *</Label>
                  <Textarea 
                    id="competitiveAdvantage"
                    {...register('competitiveAdvantage', { required: 'Competitive advantage is required' })}
                    placeholder="What makes your solution unique? Who are your competitors? (max 200 words)"
                    rows={3}
                  />
                  {errors.competitiveAdvantage && (
                    <p className="text-sm text-red-500">{errors.competitiveAdvantage.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Funding and Financials Section */}
            <Card>
              <CardHeader>
                <CardTitle>Funding and Financials</CardTitle>
                <CardDescription>
                  Tell us about your funding history and financial plans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="funding">Previous Funding</Label>
                  <Textarea 
                    id="funding"
                    {...register('funding')}
                    placeholder="Describe any previous funding rounds, grants, or investments (max 200 words)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useOfFunds">Use of Funds *</Label>
                  <Textarea 
                    id="useOfFunds"
                    {...register('useOfFunds', { required: 'Use of funds is required' })}
                    placeholder="How will you use the funding from this program? (max 200 words)"
                    rows={3}
                  />
                  {errors.useOfFunds && (
                    <p className="text-sm text-red-500">{errors.useOfFunds.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pitchDeck">Pitch Deck *</Label>
                  <div className="flex items-center">
                    <Label 
                      htmlFor="pitchDeck-upload" 
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Pitch Deck (PDF)</span>
                      <input
                        id="pitchDeck-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            register('pitchDeck').onChange(e);
                          }
                        }}
                      />
                    </Label>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {watch('pitchDeck')?.name || 'No file selected'}
                    </span>
                  </div>
                  {errors.pitchDeck && (
                    <p className="text-sm text-red-500">{errors.pitchDeck.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financials">Financial Projections</Label>
                  <div className="flex items-center">
                    <Label 
                      htmlFor="financials-upload" 
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Financials (PDF/Excel)</span>
                      <input
                        id="financials-upload"
                        type="file"
                        accept=".pdf,.xlsx,.xls"
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            register('financials').onChange(e);
                          }
                        }}
                      />
                    </Label>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {watch('financials')?.name || 'No file selected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Founder Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Founder Information</CardTitle>
                <CardDescription>
                  Tell us about the founding team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="founderBio">Founder Bio *</Label>
                  <Textarea 
                    id="founderBio"
                    {...register('founderBio', { required: 'Founder bio is required' })}
                    placeholder="Brief bio of the founding team, their backgrounds and relevant experience (max 300 words)"
                    rows={5}
                  />
                  {errors.founderBio && (
                    <p className="text-sm text-red-500">{errors.founderBio.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terms and Submission */}
            <Card>
              <CardHeader>
                <CardTitle>Terms and Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-4 text-sm">
                    <h4 className="font-medium">Terms and Conditions</h4>
                    <p className="mt-1 text-muted-foreground">
                      By submitting this application, you acknowledge that:
                    </p>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>All information provided is accurate and complete to the best of your knowledge.</li>
                      <li>You have the authority to submit this application on behalf of your startup.</li>
                      <li>The review committee has permission to verify any information provided.</li>
                      <li>The personal information collected will be used solely for the application process.</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="termsAgreed"
                      onCheckedChange={(checked) => {
                        register('termsAgreed').onChange({ target: { value: checked } });
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="termsAgreed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions *
                      </Label>
                      {errors.termsAgreed && (
                        <p className="text-sm text-red-500">You must agree to the terms</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push(`/startup-calls/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !termsAgreed}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </Layout>
  );
} 