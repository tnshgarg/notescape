import { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Key, 
  User, 
  Shield, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiKey } from '@/hooks/useApiKey';
import { validateApiKey } from '@/lib/ai';

const Settings = () => {
  const { user } = useUser();
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      setError('Please enter an API key');
      return;
    }
    
    // Basic validation - Gemini API keys typically start with "AI"
    if (!newApiKey.startsWith('AI') && newApiKey.length < 30) {
      setError('This doesn\'t look like a valid Gemini API key');
      return;
    }

    setError('');
    setIsValidating(true);

    try {
      const isValid = await validateApiKey(newApiKey.trim());
      
      if (isValid) {
        setApiKey(newApiKey.trim());
        setNewApiKey('');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Are you sure you want to remove your API key? AI features will stop working.')) {
      clearApiKey();
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 10) return '••••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Account Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </h2>
          <div className="border rounded-lg p-6">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || ''} 
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <SignOutButton>
                  <Button variant="outline" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </SignOutButton>
              </div>
            ) : (
              <p className="text-muted-foreground">Not signed in</p>
            )}
          </div>
        </section>

        {/* API Key Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gemini API Key
          </h2>
          
          <div className="border rounded-lg p-6 space-y-4">
            {/* Current API Key Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {apiKey ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">API Key configured</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">No API Key set</span>
                  </>
                )}
              </div>
              {apiKey && (
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {showApiKey ? apiKey : maskApiKey(apiKey)}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Update/Add API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {apiKey ? 'Update API Key' : 'Add API Key'}
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={newApiKey}
                  onChange={(e) => {
                    setNewApiKey(e.target.value);
                    setError('');
                  }}
                  disabled={isValidating}
                  className="flex-1 disabled:opacity-50"
                />
                <Button 
                  onClick={handleSaveApiKey} 
                  disabled={!newApiKey.trim() || isValidating}
                  className="min-w-[80px]"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            {/* Get API Key Help */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                Get your free API key from Google AI Studio:
              </p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Open Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Remove API Key */}
            {apiKey && (
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRemoveApiKey}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove API Key
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </h2>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your API key is stored locally</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Gemini API key is stored only in your browser's localStorage. It is never 
                  sent to our servers - all AI requests go directly from your browser to Google's API.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your data stays private</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your notebooks and generated notes are stored in our database, but your API key 
                  and direct AI communications remain entirely client-side.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* API Usage Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            API Usage & Limits
          </h2>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                Google's Gemini API has usage limits. If you see <strong>"quota exceeded"</strong> errors:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Wait a few minutes and try again</li>
                <li>Check your usage at <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Consider upgrading to a paid plan for higher limits</li>
              </ul>
            </div>
            <Badge variant="outline" className="text-xs">
              Free tier: ~60 requests per minute
            </Badge>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
