import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/layout/Layout';
import ClientOnly from '@/components/ui/ClientOnly';
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
import { useToast } from '@/hooks/use-toast';

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
  pitchDeck: FileList | null;
  financials: FileList | null;
  termsAgreed: boolean;
}

// Call data type
interface StartupCall {
  id: string;
  title: string;
  applicationDeadline: Date;
  industry: string;
}

// Create a wrapper component for client-side only rendering
function ApplyForCallContent() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [call, setCall] = useState<StartupCall | null>(null);
  const [fileErrors, setFileErrors] = useState<{
    pitchDeck?: string;
    financials?: string;
  }>({});
  const [termsAgreed, setTermsAgreed] = useState(false);
  const { toast } = useToast();
  
  // Debug mode toggle (set to true for testing file uploads)
  const [debugMode] = useState(true);

  // Form setup with react-hook-form
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<ApplicationFormData>({
    defaultValues: {
      startupName: '',
      website: '',
      foundingDate: '',
      teamSize: '',
      industry: call?.industry || '',
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
    },
    mode: "onChange"
  });
  
  // Debug form state
  useEffect(() => {
    console.log('Terms agreed watch value:', termsAgreed);
  }, [termsAgreed]);

  // Register termsAgreed with validation
  useEffect(() => {
    register('termsAgreed', { 
      required: 'You must agree to the terms and conditions',
      validate: value => value === true || 'You must agree to the terms and conditions'
    });
    
    // Register required select fields
    register('teamSize', { required: 'Team size is required' });
    register('industry', { required: 'Industry is required' });
    register('stage', { required: 'Startup stage is required' });
  }, [register]);

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

  // Update the file input handlers for pitchDeck and financials
  const handlePitchDeckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Pitch deck change event triggered');
    
    // Clear any previous errors
    setFileErrors(prev => ({ ...prev, pitchDeck: undefined }));
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);
      
      // Check file type
      const validTypes = ['application/pdf', '.pdf'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isValidType = validTypes.includes(fileExt) || validTypes.includes(file.type);
      
      if (!isValidType) {
        setFileErrors(prev => ({ 
          ...prev, 
          pitchDeck: `Invalid file type. Please upload a PDF file.` 
        }));
        // Clear the input
        e.target.value = '';
        setValue('pitchDeck', null);
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileErrors(prev => ({ 
          ...prev, 
          pitchDeck: `File is too large. Maximum size is 10MB.` 
        }));
        // Clear the input
        e.target.value = '';
        setValue('pitchDeck', null);
        return;
      }
      
      try {
        // Create a native FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const fileList = dataTransfer.files;
        
        // Update the form value using the native FileList
        setValue('pitchDeck', fileList, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
        
        // Show confirmation to the user
        setFileErrors(prev => ({ 
          ...prev, 
          pitchDeck: `File "${file.name}" selected successfully.` 
        }));
        
        // Debug
        console.log('Pitch deck set successfully:', file.name);
        
        // Validate the form to clear any errors
        setTimeout(() => {
          const currentValue = getValues('pitchDeck');
          const hasFile = currentValue && currentValue.length > 0;
          console.log('Current pitch deck after setting:', hasFile ? currentValue[0].name : 'No file');
        }, 100);
      } catch (error) {
        console.error('Error setting pitch deck file:', error);
        // Fallback to the old method if DataTransfer is not supported
        setValue('pitchDeck', e.target.files, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
    }
  };

  const handleFinancialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Financials change event triggered');
    
    // Clear any previous errors
    setFileErrors(prev => ({ ...prev, financials: undefined }));
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);
      
      // Check file type
      const validFinancialTypes = ['application/pdf', '.pdf', 'application/vnd.ms-excel', '.xlsx', '.xls',
                               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isValidType = validFinancialTypes.includes(fileExt) || validFinancialTypes.includes(file.type);
      
      if (!isValidType) {
        setFileErrors(prev => ({ 
          ...prev, 
          financials: `Invalid file type. Please upload a PDF or Excel file.` 
        }));
        // Clear the input
        e.target.value = '';
        setValue('financials', null);
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileErrors(prev => ({ 
          ...prev, 
          financials: `File is too large. Maximum size is 10MB.` 
        }));
        // Clear the input
        e.target.value = '';
        setValue('financials', null);
        return;
      }
      
      try {
        // Create a native FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const fileList = dataTransfer.files;
        
        // Update the form value using the native FileList
        setValue('financials', fileList, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
        
        // Show confirmation to the user
        setFileErrors(prev => ({ 
          ...prev, 
          financials: `File "${file.name}" selected successfully.` 
        }));
        
        // Debug
        console.log('Financials set successfully:', file.name);
        
        // Validate the form to clear any errors
        setTimeout(() => {
          const currentValue = getValues('financials');
          const hasFile = currentValue && currentValue.length > 0;
          console.log('Current financials after setting:', hasFile ? currentValue[0].name : 'No file');
        }, 100);
      } catch (error) {
        console.error('Error setting financials file:', error);
        // Fallback to the old method if DataTransfer is not supported
        setValue('financials', e.target.files, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: ApplicationFormData) => {
    console.log('Form submission triggered');
    console.log('Terms agreed value:', data.termsAgreed);
    
    // Check pitch deck manually one more time
    const pitchDeckFiles = data.pitchDeck as unknown as FileList;
    if (!pitchDeckFiles || pitchDeckFiles.length === 0 || !(pitchDeckFiles[0] instanceof File)) {
      console.error('Pitch deck validation failed - no file detected');
      toast({
        title: "Missing Pitch Deck",
        description: "Please upload a pitch deck file to continue",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Form is valid, continuing with submission');
    console.log('Pitch deck file detected:', pitchDeckFiles[0].name);
    
    console.log('Form submission started with data:', {
      ...data,
      pitchDeck: data.pitchDeck?.[0]?.name ? `File: ${data.pitchDeck[0].name}` : null,
      financials: data.financials?.[0]?.name ? `File: ${data.financials[0].name}` : null,
    });
    
    setSubmitting(true);
    setSubmitError('');
    
    try {
      // Handle file uploads first
      let pitchDeckUrl = null;
      let financialsUrl = null;
      
      // Upload pitch deck if provided
      if (data.pitchDeck && data.pitchDeck[0]) {
        try {
          const pitchDeckFormData = new FormData();
          
          // Ensure the file is properly attached
          const pitchDeckFile = data.pitchDeck[0];
          console.log('Preparing to upload pitch deck:', pitchDeckFile.name, pitchDeckFile.type, pitchDeckFile.size);
          
          pitchDeckFormData.append('file', pitchDeckFile);
          
          // Use debug endpoint if in debug mode
          const uploadEndpoint = debugMode ? '/api/debug-upload' : '/api/upload';
          
          console.log(`Uploading pitch deck to ${uploadEndpoint}`);
          
          const pitchDeckResponse = await fetch(uploadEndpoint, {
            method: 'POST',
            body: pitchDeckFormData,
            credentials: 'include', // Include cookies for authentication
          });
          
          const contentType = pitchDeckResponse.headers.get('content-type');
          let responseData;
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await pitchDeckResponse.json();
          } else {
            const text = await pitchDeckResponse.text();
            try {
              responseData = JSON.parse(text);
            } catch (e) {
              responseData = { message: text || 'Unknown server error' };
            }
          }
          
          console.log('Pitch deck upload response:', responseData);
          
          if (!pitchDeckResponse.ok) {
            throw new Error(responseData.message || 'Failed to upload pitch deck');
          }
          
          pitchDeckUrl = responseData.url;
          console.log('Pitch deck uploaded successfully:', pitchDeckUrl);
        } catch (error: any) {
          console.error('Pitch deck upload error:', error);
          throw new Error(`Pitch deck upload failed: ${error.message}`);
        }
      }
      
      // Upload financials if provided
      if (data.financials && data.financials[0]) {
        try {
          const financialsFormData = new FormData();
          
          // Ensure the file is properly attached
          const financialsFile = data.financials[0];
          console.log('Preparing to upload financials:', financialsFile.name, financialsFile.type, financialsFile.size);
          
          financialsFormData.append('file', financialsFile);
          
          // Use debug endpoint if in debug mode
          const uploadEndpoint = debugMode ? '/api/debug-upload' : '/api/upload';
          
          console.log(`Uploading financials to ${uploadEndpoint}`);
          
          const financialsResponse = await fetch(uploadEndpoint, {
            method: 'POST',
            body: financialsFormData,
            credentials: 'include', // Include cookies for authentication
          });
          
          const contentType = financialsResponse.headers.get('content-type');
          let responseData;
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await financialsResponse.json();
          } else {
            const text = await financialsResponse.text();
            try {
              responseData = JSON.parse(text);
            } catch (e) {
              responseData = { message: text || 'Unknown server error' };
            }
          }
          
          console.log('Financials upload response:', responseData);
          
          if (!financialsResponse.ok) {
            throw new Error(responseData.message || 'Failed to upload financials');
          }
          
          financialsUrl = responseData.url;
          console.log('Financials uploaded successfully:', financialsUrl);
        } catch (error: any) {
          console.error('Financials upload error:', error);
          throw new Error(`Financials upload failed: ${error.message}`);
        }
      }
      
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
        pitchDeckUrl: pitchDeckUrl,
        financialsUrl: financialsUrl
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
          <form onSubmit={handleSubmit(
            (data) => {
              console.log("Form valid, submitting:", data);
              onSubmit(data);
            },
            (errors) => {
              console.error("Form validation failed:", errors);
              // Create a list of fields with errors
              const errorFields = Object.keys(errors).join(", ");
              
              // Display a toast notification for validation errors
              toast({
                title: "Form Validation Failed",
                description: `Please fix errors in: ${errorFields}`,
                variant: "destructive"
              });
            }
          )} className="space-y-8">
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
                    <Select onValueChange={(value) => setValue('teamSize', value, { shouldValidate: true })}>
                      <SelectTrigger id="teamSize">
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
                      onValueChange={(value) => setValue('industry', value, { shouldValidate: true })}
                    >
                      <SelectTrigger id="industry">
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
                    <Select onValueChange={(value) => setValue('stage', value, { shouldValidate: true })}>
                      <SelectTrigger id="stage">
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
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => document.getElementById('pitchDeck-upload')?.click()}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Pitch Deck (PDF)</span>
                      </button>
                      <input
                        id="pitchDeck-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden" // Use hidden instead of sr-only for file inputs
                        {...register('pitchDeck', { 
                          validate: {
                            required: (value) => {
                              // Check if there's a file selected in the state or the form
                              const files = value as unknown as FileList;
                              const hasFile = files && files.length > 0 && files[0] instanceof File;
                              console.log('Validating pitch deck:', hasFile ? 'File exists' : 'No file');
                              return hasFile || 'Pitch deck is required';
                            }
                          }
                        })}
                        onChange={handlePitchDeckChange}
                        key="pitchDeck-input"
                      />
                      <span className="ml-3 text-sm text-muted-foreground">
                        {watch('pitchDeck')?.[0]?.name || 'No file selected'}
                      </span>
                    </div>
                    
                    {fileErrors.pitchDeck && (
                      <p className={`text-sm ${fileErrors.pitchDeck.includes('selected successfully') ? 'text-green-500' : 'text-red-500'}`}>
                        {fileErrors.pitchDeck}
                      </p>
                    )}
                    {errors.pitchDeck && (
                      <p className="text-sm text-red-500">{errors.pitchDeck.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financials">Financial Projections</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => document.getElementById('financials-upload')?.click()}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Financials (PDF/Excel)</span>
                      </button>
                      <input
                        id="financials-upload"
                        type="file"
                        accept=".pdf,.xlsx,.xls"
                        className="hidden" // Use hidden instead of sr-only for file inputs
                        {...register('financials')}
                        onChange={handleFinancialsChange}
                        key="financials-input"
                      />
                      <span className="ml-3 text-sm text-muted-foreground">
                        {watch('financials')?.[0]?.name || 'No file selected'}
                      </span>
                    </div>
                    
                    {fileErrors.financials && (
                      <p className={`text-sm ${fileErrors.financials.includes('selected successfully') ? 'text-green-500' : 'text-red-500'}`}>
                        {fileErrors.financials}
                      </p>
                    )}
                    {errors.financials && (
                      <p className="text-sm text-red-500">{errors.financials.message}</p>
                    )}
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
                  
                  <div className="mt-8 flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Terms and Conditions</h3>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAgreed}
                        onCheckedChange={(checked) => {
                          console.log('Checkbox changed to:', checked);
                          // First update the form value
                          setValue('termsAgreed', checked === true, { 
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true
                          });
                          // Then update the local state
                          setTermsAgreed(checked === true);
                        }}
                        {...register('termsAgreed', { 
                          required: 'You must agree to the terms and conditions'
                        })}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the terms and conditions
                        </label>
                        <p className="text-sm text-muted-foreground">
                          By submitting this application, you agree to our Terms of Service and Privacy Policy.
                        </p>
                        {errors.termsAgreed && (
                          <p className="text-sm text-destructive">{errors.termsAgreed.message}</p>
                        )}
                      </div>
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
                  disabled={submitting}
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

            {/* Debug form values */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="mt-4 border-dashed border-gray-300">
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                    Form Values: {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(watch()).filter(([key, value]) => 
                          typeof value !== 'object' || value === null || key === 'termsAgreed'
                        )
                      ), 
                      null, 
                      2
                    )}
                  </pre>
                  <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded mt-2">
                    Form Errors: {JSON.stringify(
                      // Simpler approach to avoid TypeScript errors
                      Object.keys(errors).map(key => `${key}: ${errors[key as keyof typeof errors]?.message || 'Invalid'}`),
                      null,
                      2
                    )}
                  </pre>
                  <div className="mt-2">
                    <p className="text-sm">Terms Agreed State: {termsAgreed ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const safeValues = Object.fromEntries(
                          Object.entries(watch()).filter(([key, value]) => 
                            typeof value !== 'object' || value === null || key === 'termsAgreed'
                          )
                        );
                        
                        // Simpler approach to log errors
                        const errorList = Object.keys(errors).map(key => 
                          `${key}: ${errors[key as keyof typeof errors]?.message || 'Invalid'}`
                        );
                        
                        console.log('Current form values:', safeValues);
                        console.log('Current form errors:', errorList);
                        toast({
                          title: "Form Data Logged",
                          description: "Check browser console for current form data",
                        });
                      }}
                    >
                      Log Form Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </main>
      </div>
    </Layout>
  );
}

// Main export is now a thin wrapper that uses ClientOnly
export default function ApplyForCall() {
  return (
    <ClientOnly fallback={
      <Layout title="Loading Application Form">
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading application form...</p>
        </div>
      </Layout>
    }>
      <ApplyForCallContent />
    </ClientOnly>
  );
} 