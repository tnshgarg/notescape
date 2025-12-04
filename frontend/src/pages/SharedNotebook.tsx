import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Heart, Copy, BookOpen, User, Calendar, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import type { Notebook } from '@/lib/notebookApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type Mode = 'socrates' | 'aristotle' | 'plato';

const SharedNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>('socrates');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);

  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notebooks/public/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch notebook');
        }
        
        setNotebook(data.notebook);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notebook');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotebook();
    }
  }, [id]);

  const handleClone = async () => {
    if (!user || !notebook) return;
    
    setIsCloning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebook._id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          authorName: user.fullName || user.username || 'Anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to clone notebook');
      }

      setCloneSuccess(true);
      setTimeout(() => setCloneSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to clone:', err);
    } finally {
      setIsCloning(false);
    }
  };

  const modeDescriptions: Record<Mode, { title: string; description: string }> = {
    socrates: { title: 'Socrates Mode', description: 'Easy explanations with examples' },
    aristotle: { title: 'Aristotle Mode', description: 'In-depth research and analysis' },
    plato: { title: 'Plato Mode', description: 'Exam-focused study notes' }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading notebook...</p>
        </div>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {error === 'This notebook is private' ? 'Private Notebook' : 'Notebook Not Found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "The notebook you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/marketplace">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl truncate">{notebook.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {notebook.authorName || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {notebook.likes} likes
              </span>
            </div>
          </div>

          {user && (
            <Button 
              onClick={handleClone} 
              disabled={isCloning}
              variant={cloneSuccess ? "outline" : "default"}
              className="gap-2"
            >
              {cloneSuccess ? (
                <>✓ Copied to Library</>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {isCloning ? 'Copying...' : 'Copy to Library'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Description */}
        {notebook.description && (
          <div className="mb-8 p-4 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">{notebook.description}</p>
            <div className="flex gap-2 mt-3">
              {notebook.category && (
                <Badge variant="secondary">{notebook.category}</Badge>
              )}
              <Badge variant="outline">
                <BookOpen className="h-3 w-3 mr-1" />
                {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        )}

        {/* Generated Notes */}
        <div className="border rounded-lg">
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as Mode)}>
            <div className="border-b p-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="socrates">Socrates</TabsTrigger>
                <TabsTrigger value="aristotle">Aristotle</TabsTrigger>
                <TabsTrigger value="plato">Plato</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {(['socrates', 'aristotle', 'plato'] as Mode[]).map((mode) => (
                <TabsContent key={mode} value={mode} className="m-0">
                  {notebook.generatedNotes?.[mode] ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="mb-4 pb-4 border-b">
                        <h2 className="text-xl font-semibold mb-1 mt-0">
                          {modeDescriptions[mode].title}
                        </h2>
                        <p className="text-sm text-muted-foreground m-0">
                          {modeDescriptions[mode].description}
                        </p>
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {notebook.generatedNotes[mode]}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {modeDescriptions[mode].title} notes have been generated yet.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SharedNotebook;
