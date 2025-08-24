import React, { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentSidebar } from './DocumentSidebar';
import { DocumentUpload } from './DocumentUpload';
import { QAInterface } from './QAInterface';
import { ApiKeySettings } from './ApiKeySettings';
import { Button } from '@/components/ui/button';
import { Upload, FileText, MessageSquare, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DocumentQAApp: React.FC = () => {
  const {
    documents,
    qaHistory,
    currentDocument,
    isLoading,
    setCurrentDocument,
    simulateUpload,
    askQuestion,
    searchQA,
    deleteDocument
  } = useDocuments();

  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [qaSearchQuery, setQaSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      await simulateUpload(file);
      setShowUpload(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!currentDocument) return;
    await askQuestion(question, currentDocument.id);
  };

  const filteredDocuments = sidebarSearchQuery.trim()
    ? documents.filter(doc => 
        doc.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
      )
    : documents;

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">DocuChat</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "w-80 border-r border-border flex flex-col transition-transform duration-200 ease-in-out",
        "md:relative md:translate-x-0",
        "absolute inset-y-0 left-0 z-50 bg-background md:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b bg-card">
          <div className="hidden md:flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DocuChat</h1>
              <p className="text-sm text-muted-foreground">Document Q&A Assistant</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setShowUpload(!showUpload);
              setSidebarOpen(false); // Close sidebar on mobile after action
            }}
            className="w-full"
            variant={showUpload ? "secondary" : "default"}
          >
            <Upload className="h-4 w-4 mr-2" />
            {showUpload ? "Hide Upload" : "Upload Document"}
          </Button>
        </div>

        {showUpload && (
          <div className="p-4 border-b">
            <DocumentUpload onUpload={handleUpload} />
          </div>
        )}

        <div className="p-4 border-b">
          <ApiKeySettings onApiKeyChange={setHasApiKey} />
        </div>

        <div className="flex-1 overflow-hidden">
          <DocumentSidebar
            documents={filteredDocuments}
            currentDocument={currentDocument}
            onDocumentSelect={(doc) => {
              setCurrentDocument(doc);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            onDocumentDelete={deleteDocument}
            searchQuery={sidebarSearchQuery}
            onSearchChange={setSidebarSearchQuery}
          />
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{documents.length}</div>
              <div className="text-xs text-muted-foreground">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{qaHistory.length}</div>
              <div className="text-xs text-muted-foreground">Total Q&As</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentDocument ? (
          <QAInterface
            document={currentDocument}
            qaHistory={qaHistory}
            isLoading={isLoading}
            onAskQuestion={handleAskQuestion}
            searchQuery={qaSearchQuery}
            onSearchChange={setQaSearchQuery}
            hasApiKey={hasApiKey}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-subtle">
            <div className="text-center space-y-6 max-w-md">
              <div className="p-6 rounded-full bg-primary/10 inline-block animate-pulse-glow">
                <MessageSquare className="h-16 w-16 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">Welcome to DocuChat</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your intelligent document Q&A assistant. Upload documents and ask questions 
                  to get instant, contextual answers powered by AI.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-card border text-left">
                  <div className="font-medium mb-1">📄 Upload Documents</div>
                  <div className="text-muted-foreground">Support for PDF, DOC, DOCX, and TXT files</div>
                </div>
                <div className="p-4 rounded-lg bg-card border text-left">
                  <div className="font-medium mb-1">❓ Ask Questions</div>
                  <div className="text-muted-foreground">Get intelligent answers based on document content</div>
                </div>
                <div className="p-4 rounded-lg bg-card border text-left">
                  <div className="font-medium mb-1">🔍 Search History</div>
                  <div className="text-muted-foreground">Find previous conversations easily</div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowUpload(true);
                  setSidebarOpen(true); // Open sidebar to show upload
                }}
                size="lg"
                className="animate-fade-in"
              >
                <Upload className="h-5 w-5 mr-2" />
                Get Started - Upload Your First Document
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};