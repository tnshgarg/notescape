import { useState } from 'react';
import { Tabs, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Brain, BookOpen, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateNotes } from '@/lib/ai';
import { saveGeneratedNotes, type Notebook, type Source, type Chapter } from '@/lib/notebookApi';
import { useApiKey } from '@/hooks/useApiKey';

interface NoteViewerProps {
  notebook: Notebook;
  sources: Source[];
  onNotebookUpdate?: (notebook: Notebook) => void;
  selectedChapter?: Chapter | null;
  onNavigateChapter?: (direction: 'prev' | 'next') => void;
  onJumpToChapter?: (chapter: Chapter) => void;
}

type Mode = 'socrates' | 'aristotle' | 'plato';

const modeDescriptions: Record<Mode, { title: string; description: string; icon: any; color: string }> = {
  socrates: {
    title: 'Socrates',
    description: 'Simple explanations & examples',
    icon: Sparkles,
    color: 'text-violet-500'
  },
  aristotle: {
    title: 'Aristotle', 
    description: 'Deep dive & detailed analysis',
    icon: Loader2, // Using Loader2 as placeholder, ideally use Microscope or similar if available
    color: 'text-emerald-500'
  },
  plato: {
    title: 'Plato',
    description: 'Key concepts & exam prep',
    icon: Brain, // Using Brain as placeholder for "Idea/Form"
    color: 'text-amber-500'
  }
};

const NoteViewer = ({ notebook, sources, onNotebookUpdate, selectedChapter, onNavigateChapter, onJumpToChapter }: NoteViewerProps) => {
  const { apiKey } = useApiKey();
  const [activeMode, setActiveMode] = useState<Mode>('socrates');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state for current notes based on selection
  const currentNotes = selectedChapter?.generatedNotes?.[activeMode] || 
                      (!selectedChapter ? notebook?.generatedNotes?.[activeMode] : '');

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings');
      return;
    }

    // If no chapter selected, warn user or default to first
    if (!selectedChapter && sources.length > 0 && sources[0].chapters && sources[0].chapters.length > 0) {
      setError('Please select a chapter from the sidebar to generate notes.');
      return;
    }

    const content = selectedChapter ? selectedChapter.content : '';
    
    if (!content.trim()) {
      setError('No content to generate notes from. Please select a chapter with content.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateNotes({
        content,
        mode: activeMode,
        apiKey
      });

      // Save to database (specific chapter if selected)
      const updatedNotebook = await saveGeneratedNotes(
        notebook._id, 
        activeMode, 
        response.notes,
        selectedChapter?._id
      );
      
      onNotebookUpdate?.(updatedNotebook);
    } catch (err: unknown) {
      // Check if it's a quota or auth error
      const error = err as { isQuotaError?: boolean; isAuthError?: boolean; message?: string };
      if (error.isQuotaError) {
        setError('⚠️ API quota exceeded. Please wait a few minutes and try again.');
      } else if (error.isAuthError) {
        setError('🔑 Invalid API key. Please check your key in Settings.');
      } else {
        setError(error.message || 'Failed to generate notes');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const hasContent = currentNotes && currentNotes.trim().length > 0;

  return (
    <div className="h-full flex flex-col bg-background border-l overflow-hidden">
      <Tabs 
        value={activeMode} 
        onValueChange={(v) => setActiveMode(v as Mode)} 
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="border-b px-4 py-3 flex-shrink-0 space-y-3 bg-muted/5">
          {/* Mode Selection - Compact & Premium */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-muted/50 p-1 rounded-lg border shadow-sm">
              {(['socrates', 'aristotle', 'plato'] as Mode[]).map((mode) => {
                const isActive = activeMode === mode;
                const Info = modeDescriptions[mode];
                const Icon = mode === 'socrates' ? Sparkles : (mode === 'aristotle' ? BookOpen : GraduationCap);
                
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? Info.color : ''}`} />
                    {Info.title}
                  </button>
                );
              })}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !apiKey || !selectedChapter}
              size="sm"
              className="h-8 px-3 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="sr-only sm:not-sr-only sm:inline-block">Generating...</span>
                </>
              ) : hasContent ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:inline-block">Regenerate</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:inline-block">Generate</span>
                </>
              )}
            </Button>
          </div>

          {/* Description - Subtle */}
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pl-1">
            {modeDescriptions[activeMode].description}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-4">
                {error}
              </div>
            )}

            {/* Chapter Context Warning */}
            {!selectedChapter && (
              <div className="bg-muted/50 border rounded-lg p-4 mb-6 text-center">
                <p className="text-muted-foreground">
                  Select a chapter from the sidebar to view or generate notes.
                </p>
              </div>
            )}

            {['socrates', 'aristotle', 'plato'].map((mode) => {
              const notesForMode = selectedChapter?.generatedNotes?.[mode as Mode] || 
                                  (!selectedChapter ? notebook?.generatedNotes?.[mode as Mode] : '');
              
              return (
                <TabsContent key={mode} value={mode} className="m-0 mt-0">
                  {notesForMode ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="mb-4 pb-4 border-b">
                        <h2 className="text-xl font-semibold mb-1 mt-0">
                          {modeDescriptions[mode as Mode].title}
                        </h2>
                        <p className="text-sm text-muted-foreground m-0">
                          {modeDescriptions[mode as Mode].description}
                        </p>
                        {selectedChapter && (
                          <p className="text-xs text-primary mt-2 font-medium">
                            Chapter: {selectedChapter.title}
                          </p>
                        )}
                      </div>
                      {/* Render Markdown content */}
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for markdown elements
                          h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                          p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="leading-relaxed">{children}</li>,
                          code: ({className, children, ...props}) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                            ) : (
                              <code className={`${className} block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono`} {...props}>{children}</code>
                            );
                          },
                          pre: ({children}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">{children}</blockquote>,
                          table: ({children}) => <div className="overflow-x-auto mb-4"><table className="w-full border-collapse border border-border">{children}</table></div>,
                          th: ({children}) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>,
                          td: ({children}) => <td className="border border-border px-4 py-2">{children}</td>,
                          hr: () => <hr className="my-6 border-border" />,
                          a: ({href, children}) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                        }}
                      >
                        {notesForMode}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No {modeDescriptions[mode as Mode].title} Notes Yet
                      </h3>
                      <p className="text-muted-foreground max-w-sm mb-4">
                        {modeDescriptions[mode as Mode].description}
                      </p>
                      {!apiKey && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          Please set your Gemini API key to generate notes
                        </p>
                      )}
                      {selectedChapter && apiKey && (
                         <Button onClick={handleGenerate} variant="outline" className="mt-2">
                           Generate Notes for this Chapter
                         </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </div>
        </div>

        {/* Footer with Pagination */}
        <div className="h-14 border-t flex items-center justify-between px-4 bg-muted/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={!selectedChapter || !onNavigateChapter}
              onClick={() => onNavigateChapter?.('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Pagination Numbers */}
            {selectedChapter && notebook.sources.map(source => {
              // Only show pagination for the source of the selected chapter
              if (source._id !== selectedChapter.sourceId) return null;
              
              const chapters = source.chapters || [];
              if (chapters.length <= 1) return null;

              return (
                <div key={source._id} className="flex items-center gap-1">
                  {chapters.sort((a, b) => a.order - b.order).map((chapter, idx) => (
                    <Button
                      key={chapter._id || idx}
                      variant={selectedChapter._id === chapter._id ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs ${
                        selectedChapter._id === chapter._id 
                          ? "" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => onJumpToChapter?.(chapter)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
              );
            })}

            <Button 
              variant="ghost" 
              size="sm" 
              disabled={!selectedChapter || !onNavigateChapter}
              onClick={() => onNavigateChapter?.('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {selectedChapter ? selectedChapter.title : 'Select a chapter'}
          </span>
        </div>
      </Tabs>
    </div>
  );
};

export default NoteViewer;
