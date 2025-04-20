import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, FileText } from 'lucide-react';

interface FileUploadProps {
  id: string;
  label: string;
  accept: string;
  value: File | null;
  onChange: (file: File | null) => void;
  isRequired?: boolean;
  error?: string;
}

export default function FileUpload({
  id,
  label,
  accept,
  value,
  onChange,
  isRequired = false,
  error
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      onChange(null);
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Call the upload API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      // Update the form with the selected file
      onChange(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Reset the file input
      e.target.value = '';
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearFile = () => {
    onChange(null);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-upload`} className={error ? 'text-red-500' : ''}>
        {label} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex w-full items-center justify-between rounded-md border border-input bg-background p-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm">{value.name}</span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={clearFile} 
              disabled={isUploading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="flex items-center gap-2"
              asChild
            >
              <Label htmlFor={`${id}-upload`} className="cursor-pointer m-0">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload file</span>
                  </>
                )}
              </Label>
            </Button>
            <span className="text-sm text-muted-foreground">
              {accept.split(',').map(ext => ext.trim()).join(', ')}
            </span>
          </>
        )}
        
        <input
          id={`${id}-upload`}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
          className="sr-only"
        />
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
} 