import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, XCircle, Plus, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Define StartupCall type to match the database model
type StartupCallStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

interface StartupCall {
  id?: string;
  title: string;
  description: string;
  status: StartupCallStatus;
  applicationDeadline: Date | string;
  publishedDate?: Date | string | null;
  industry: string;
  location: string;
  fundingAmount?: string | null;
  requirements: string[];
  eligibilityCriteria: string[];
  selectionProcess: string[];
  aboutSponsor?: string | null;
  applicationProcess: string;
}

interface StartupCallFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StartupCall & { createdAt?: Date | string }) => Promise<void>;
  initialData?: Partial<StartupCall & { createdAt?: Date | string }> | null;
  isSubmitting: boolean;
}

const StartupCallForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: StartupCallFormProps) => {
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  
  const [eligibilityCriteria, setEligibilityCriteria] = useState<string[]>([]);
  const [newCriteria, setNewCriteria] = useState('');
  
  const [selectionProcess, setSelectionProcess] = useState<string[]>([]);
  const [newProcessStep, setNewProcessStep] = useState('');

  const isEditing = !!initialData?.id;

  // Setup form handling
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<StartupCall>({
    defaultValues: initialData || {
      title: '',
      description: '',
      status: 'DRAFT',
      applicationDeadline: '',
      industry: '',
      location: '',
      fundingAmount: '',
      requirements: [],
      eligibilityCriteria: [],
      selectionProcess: [],
      aboutSponsor: '',
      applicationProcess: '',
    }
  });

  // Format date for the input
  const formatDateForInput = (date: Date | string | undefined | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setRequirements(initialData.requirements || []);
      setEligibilityCriteria(initialData.eligibilityCriteria || []);
      setSelectionProcess(initialData.selectionProcess || []);
      
      // Format the date for the input field
      if (initialData.applicationDeadline) {
        setValue('applicationDeadline', formatDateForInput(initialData.applicationDeadline));
      }
    } else {
      setRequirements([]);
      setEligibilityCriteria([]);
      setSelectionProcess([]);
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = (data: StartupCall) => {
    // Include array fields
    const formData = {
      ...data,
      requirements,
      eligibilityCriteria,
      selectionProcess,
    };
    
    onSubmit(formData);
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleAddCriteria = () => {
    if (newCriteria.trim()) {
      setEligibilityCriteria([...eligibilityCriteria, newCriteria.trim()]);
      setNewCriteria('');
    }
  };

  const handleRemoveCriteria = (index: number) => {
    setEligibilityCriteria(eligibilityCriteria.filter((_, i) => i !== index));
  };

  const handleAddProcessStep = () => {
    if (newProcessStep.trim()) {
      setSelectionProcess([...selectionProcess, newProcessStep.trim()]);
      setNewProcessStep('');
    }
  };

  const handleRemoveProcessStep = (index: number) => {
    setSelectionProcess(selectionProcess.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Startup Call' : 'Create New Startup Call'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this startup call.'
              : 'Fill in the details to create a new startup call.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Startup Call Title"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                defaultValue={watch('status')}
                onValueChange={(value) => setValue('status', value as StartupCallStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Detailed description of the startup call"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application Deadline *</Label>
              <Input
                id="applicationDeadline"
                type="date"
                {...register('applicationDeadline', { required: 'Deadline is required' })}
              />
              {errors.applicationDeadline && (
                <p className="text-sm text-red-500">{errors.applicationDeadline.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                {...register('industry', { required: 'Industry is required' })}
                placeholder="e.g. Technology, Healthcare, Energy"
              />
              {errors.industry && (
                <p className="text-sm text-red-500">{errors.industry.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...register('location', { required: 'Location is required' })}
                placeholder="e.g. Global, North America, Europe"
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fundingAmount">Funding Amount</Label>
              <Input
                id="fundingAmount"
                {...register('fundingAmount')}
                placeholder="e.g. $50,000 - $100,000"
              />
            </div>
          </div>
          
          {/* Requirements Section */}
          <div className="space-y-2 border p-4 rounded-md">
            <Label>Requirements</Label>
            <div className="flex space-x-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="e.g. MVP ready"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
              />
              <Button type="button" onClick={handleAddRequirement} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {requirements.map((req, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  {req}
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
              {requirements.length === 0 && (
                <p className="text-sm text-muted-foreground">No requirements added.</p>
              )}
            </div>
          </div>
          
          {/* Eligibility Criteria Section */}
          <div className="space-y-2 border p-4 rounded-md">
            <Label>Eligibility Criteria</Label>
            <div className="flex space-x-2">
              <Input
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder="e.g. Startups must be legally registered entities"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCriteria())}
              />
              <Button type="button" onClick={handleAddCriteria} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {eligibilityCriteria.map((criteria, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <p className="text-sm">{criteria}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCriteria(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {eligibilityCriteria.length === 0 && (
                <p className="text-sm text-muted-foreground">No eligibility criteria added.</p>
              )}
            </div>
          </div>
          
          {/* Selection Process Section */}
          <div className="space-y-2 border p-4 rounded-md">
            <Label>Selection Process</Label>
            <div className="flex space-x-2">
              <Input
                value={newProcessStep}
                onChange={(e) => setNewProcessStep(e.target.value)}
                placeholder="e.g. Initial application screening"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProcessStep())}
              />
              <Button type="button" onClick={handleAddProcessStep} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {selectionProcess.map((step, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <div className="flex items-center">
                    <span className="font-bold mr-2">{index + 1}.</span>
                    <p className="text-sm">{step}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProcessStep(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {selectionProcess.length === 0 && (
                <p className="text-sm text-muted-foreground">No selection process steps added.</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aboutSponsor">About the Sponsor</Label>
            <Textarea
              id="aboutSponsor"
              {...register('aboutSponsor')}
              placeholder="Information about the sponsor of this call"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="applicationProcess">Application Process *</Label>
            <Textarea
              id="applicationProcess"
              {...register('applicationProcess', { required: 'Application process is required' })}
              placeholder="Description of the application process and timeline"
              rows={3}
            />
            {errors.applicationProcess && (
              <p className="text-sm text-red-500">{errors.applicationProcess.message}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update Call' : 'Create Call'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartupCallForm; 