import { useState } from 'react';
import { ExternalLink, Info, Key, Loader2, AlertCircle } from 'lucide-react';
import { useApiKey } from '@/hooks/useApiKey';
import { validateApiKey } from '@/lib/ai';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog = ({ open, onOpenChange }: ApiKeyDialogProps) => {
  const { setApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setError('API key is required');
      return;
    }
    
    setError('');
    setIsValidating(true);

    try {
      const { isValid, error: validationError } = await validateApiKey(inputValue.trim());
      
      if (isValid) {
        setApiKey(inputValue.trim());
        onOpenChange(false);
      } else {
        setError(validationError || 'Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isValidating) {
      onOpenChange(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Gemini API Key</h2>
            <p className="text-sm text-muted-foreground">Required to use AI features</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Get your free API key:</p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Your API key is stored locally in your browser and never sent to our servers. It's only used to make requests directly to Google's Gemini API.
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label htmlFor="api-key-input" className="text-sm font-medium">
            API Key
          </label>
          <input
            id="api-key-input"
            type="password"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            disabled={isValidating}
            placeholder="Enter your Gemini API key"
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isValidating}
            className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isValidating || !inputValue.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Save API Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
