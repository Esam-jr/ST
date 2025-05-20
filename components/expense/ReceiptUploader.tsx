import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, File, Upload, X, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ReceiptUploaderProps {
  onFileUploaded: (filePath: string, fileName: string) => void;
  existingReceipt?: string | null;
  onRemoveExisting?: () => void;
}

export default function ReceiptUploader({
  onFileUploaded,
  existingReceipt,
  onRemoveExisting,
}: ReceiptUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const response = await axios.post(
        "/api/expenses/upload-receipt",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Receipt uploaded",
          description: "Your receipt has been uploaded successfully",
        });
        onFileUploaded(response.data.filePath, response.data.fileName);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload receipt. Please try again.");
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your receipt",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSelected = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const isImage = (filename: string) => {
    const ext = getFileExtension(filename);
    return ["jpg", "jpeg", "png"].includes(ext);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="receipt">Receipt</Label>

      {existingReceipt ? (
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <File className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">
            {existingReceipt.split("/").pop() || "Receipt"}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => window.open(existingReceipt, "_blank")}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            {onRemoveExisting && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onRemoveExisting}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        </div>
      ) : file ? (
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <File className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{file.name}</span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemoveSelected}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <LoadingSpinner size={16} />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="ml-2">Upload</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            id="receipt"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,application/pdf"
            className="flex-1"
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Upload JPEG, PNG, or PDF (max 5MB)
      </p>
    </div>
  );
}
