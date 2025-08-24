import React, { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, className }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsUploading(true);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        await onUpload(files[0]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    setIsUploading(false);
  }, [onUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(files[0]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
      setIsUploading(false);
    }
  }, [onUpload]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border",
          isUploading && "pointer-events-none opacity-75"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Upload className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isUploading ? "Uploading..." : "Upload Document"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOC, DOCX, TXT files up to 10MB
            </p>
          </div>

          {!isUploading && (
            <Button variant="outline" className="relative">
              Browse Files
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};