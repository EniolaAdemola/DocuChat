import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Key, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiKeySettingsProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsValid(true);
      onApiKeyChange?.(true);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Invalid API Key",
        description: "OpenAI API keys should start with 'sk-'",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('openai-api-key', apiKey);
    setIsValid(true);
    onApiKeyChange?.(true);
    
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved successfully",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('openai-api-key');
    setApiKey('');
    setIsValid(false);
    onApiKeyChange?.(false);
    
    toast({
      title: "API Key Removed",
      description: "Your OpenAI API key has been removed",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4" />
          OpenAI API Key
        </CardTitle>
        <CardDescription className="text-xs">
          Enter your OpenAI API key to enable AI-powered document analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-8 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isValid && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              <span>API key configured</span>
            </div>
          )}
          
          {!isValid && apiKey && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>Click save to validate</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1 h-8 text-xs"
            disabled={!apiKey.trim()}
          >
            Save
          </Button>
          
          {isValid && (
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};