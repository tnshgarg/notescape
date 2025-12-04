import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Sparkles, ArrowUp, Loader2 } from 'lucide-react';
import { chatWithAI } from '@/lib/ai';
import { useApiKey } from '@/hooks/useApiKey';
import type { Chapter } from '@/lib/notebookApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  sourcesUsed?: string[]; // Show which chapters were used for context
}

interface AIAssistantProps {
  onClose?: () => void;
  notebookContext?: string;
  notebookTitle?: string;
  notebookId?: string;
  chapters?: Chapter[];
  selectedChapter?: Chapter | null;
}

// Note: notebookId, chapters, selectedChapter are passed for future RAG implementation
const AIAssistant = ({ onClose, notebookContext, notebookTitle, notebookId: _notebookId, chapters: _chapters, selectedChapter: _selectedChapter }: AIAssistantProps) => {
  const { apiKey } = useApiKey();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI assistant. ${notebookTitle ? `I'm here to help you understand "${notebookTitle}".` : "I'm here to help you with your notes."} Ask me anything!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Please set your Gemini API key in settings to chat with me.'
      }]);
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      isLoading: true
    }]);

    try {
      const response = await chatWithAI({
        message: input,
        context: notebookContext,
        apiKey
      });

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
          ? { ...msg, content: response.reply, isLoading: false }
          : msg
      ));
    } catch (error) {
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
          ? { 
              ...msg, 
              content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
              isLoading: false 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Model Indicator */}
      <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Powered by Gemini
        </span>
        <span className={`text-xs ${apiKey ? 'text-green-600' : 'text-amber-600'}`}>
          {apiKey ? '● Connected' : '○ API Key Required'}
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'assistant' 
                  ? 'bg-muted/50' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded text-xs overflow-x-auto my-2" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="relative">
          <Input 
            placeholder={apiKey ? "Ask a question about your notes..." : "Set API key to chat..."} 
            className="pr-10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            className="absolute right-1 top-1 h-7 w-7"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
