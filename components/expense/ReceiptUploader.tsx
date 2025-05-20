import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, CheckCircle } from "lucide-react";

interface ReceiptUploaderProps {
  onFileUploaded: (filePath: string) => void;
  existingReceipt?: string | null;
  onRemoveExisting?: () => void;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  onFileUploaded,
  existingReceipt,
  onRemoveExisting,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid file (JPEG, PNG or PDF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Directly notify parent component of file selection
    onFileUploaded(URL.createObjectURL(file));
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="receipt">Receipt (Optional)</Label>

      {/* Show existing receipt if available */}
      {existingReceipt && !selectedFile && (
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <FileText className="h-5 w-5 text-blue-500" />
          <span className="flex-1 text-sm truncate">Existing Receipt</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(existingReceipt, "_blank")}
            >
              View
            </Button>
            {onRemoveExisting && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemoveExisting}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload new receipt */}
      {!existingReceipt && !selectedFile ? (
        <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground mb-2">
            Drag and drop your receipt here or click to browse
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Receipt
          </Button>
          <Input
            id="receipt"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: JPEG, PNG, PDF (max 5MB)
          </p>
        </div>
      ) : (
        selectedFile && (
          <div className="border rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      )}

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ReceiptUploader;
