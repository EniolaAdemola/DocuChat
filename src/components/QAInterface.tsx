import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Clock, Search } from 'lucide-react';
import { type Document, type QAItem as QAItemType } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface QAInterfaceProps {
  document: Document | null;
  qaHistory: QAItemType[];
  isLoading: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasApiKey?: boolean;
}

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const QAItemComponent: React.FC<{ qa: QAItemType; isSearchResult?: boolean; searchQuery?: string }> = ({
  qa, 
  isSearchResult = false,
  searchQuery = '' 
}) => {
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-warning/30 text-warning-foreground rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={cn(
      "space-y-4 p-4 rounded-lg",
      isSearchResult && "bg-muted/30 border border-border"
    )}>
      {/* Question */}
      <div className="flex gap-3">
        <div className="p-2 rounded-full bg-primary text-primary-foreground flex-shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">You</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(qa.timestamp)}
            </span>
          </div>
          <p className="text-foreground">
            {highlightText(qa.question, searchQuery)}
          </p>
        </div>
      </div>

      {/* Answer */}
      <div className="flex gap-3">
        <div className="p-2 rounded-full bg-accent text-accent-foreground flex-shrink-0">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-sm font-medium">AI Assistant</span>
          <div className="text-foreground leading-relaxed">
            {highlightText(qa.answer, searchQuery)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const QAInterface: React.FC<QAInterfaceProps> = ({
  document,
  qaHistory,
  isLoading,
  onAskQuestion,
  searchQuery,
  onSearchChange,
  hasApiKey = false
}) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading || !document) return;
    
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your OpenAI API key in the sidebar to ask questions.",
        variant: "destructive"
      });
      return;
    }

    const currentQuestion = question;
    setQuestion('');
    
    try {
      await onAskQuestion(currentQuestion);
    } catch (error) {
      console.error('Failed to ask question:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [qaHistory]);

  const filteredQAHistory = searchQuery.trim() 
    ? qaHistory.filter(qa => 
        qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : qaHistory;

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <div className="p-4 rounded-full bg-muted inline-block">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
            <p className="text-muted-foreground">
              Select a document from the sidebar to start asking questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold truncate">
            Q&A: {document.name}
          </h2>
          <div className="text-sm text-muted-foreground">
            {qaHistory.length} conversation{qaHistory.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {filteredQAHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              {searchQuery.trim() ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations match your search.</p>
                </div>
              ) : (
                <div>
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No questions asked yet. Start a conversation below!</p>
                </div>
              )}
            </div>
          ) : (
            filteredQAHistory.map((qa, index) => (
              <div key={qa.id}>
                <QAItemComponent 
                  qa={qa} 
                  isSearchResult={!!searchQuery.trim()}
                  searchQuery={searchQuery}
                />
                {index < filteredQAHistory.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="p-2 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-sm font-medium">AI Assistant</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a question about this document..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading || document.status !== 'ready'}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Press Cmd/Ctrl + Enter to send</span>
                <span>{question.length}/500</span>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={!question.trim() || isLoading || document.status !== 'ready'}
              className="self-end h-fit px-4 py-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};