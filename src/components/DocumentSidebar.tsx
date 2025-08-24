import React from 'react';
import { File, Search, Trash2, Clock, FileText } from 'lucide-react';
import { Document } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  documents: Document[];
  currentDocument: Document | null;
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  currentDocument,
  onDocumentSelect,
  onDocumentDelete,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="h-full flex flex-col bg-card border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents
        </h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-muted/50 hover:shadow-soft",
                  currentDocument?.id === document.id
                    ? "bg-primary/10 border border-primary/20 shadow-soft"
                    : "hover:bg-muted"
                )}
                onClick={() => onDocumentSelect(document)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-md flex-shrink-0",
                    document.status === 'ready' ? "bg-success/10 text-success" :
                    document.status === 'uploading' ? "bg-warning/10 text-warning" :
                    document.status === 'processing' ? "bg-primary/10 text-primary" :
                    "bg-destructive/10 text-destructive"
                  )}>
                    <File className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-1">
                      {document.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(document.size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(document.uploadDate)}
                      </span>
                    </div>

                    {document.status === 'uploading' && document.progress !== undefined && (
                      <div className="space-y-1">
                        <Progress value={document.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground">
                          Uploading {Math.round(document.progress)}%
                        </p>
                      </div>
                    )}

                    {document.status === 'processing' && (
                      <p className="text-xs text-primary">Processing...</p>
                    )}

                    {document.status === 'error' && (
                      <p className="text-xs text-destructive">Upload failed</p>
                    )}
                  </div>

                  {document.status === 'ready' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentDelete(document.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};