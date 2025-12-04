import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Heart, Copy, BookOpen, User, Calendar, Lock, FileText, PanelLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import SourceViewer from '@/components/SourceViewer';
import WorkspaceSidebar from '@/components/WorkspaceSidebar';
import { likeNotebook, type Notebook, type Chapter } from '@/lib/notebookApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type Mode = 'socrates' | 'aristotle' | 'plato';

const SharedNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>('socrates');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  // Extract all chapters from all sources
  const allChapters = useMemo(() => {
    if (!notebook?.sources) return [];
    return notebook.sources.flatMap((source, sourceIndex) => 
      (source.chapters || []).map(chapter => ({
        ...chapter,
        _id: chapter._id || `${source._id}-${chapter.order}`,
        sourceId: source._id || `source-${sourceIndex}`
      }))
    );
  }, [notebook]);

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    const sourceIndex = notebook?.sources.findIndex(s => s._id === chapter.sourceId);
    if (sourceIndex !== undefined && sourceIndex >= 0) {
      setSelectedSourceIndex(sourceIndex);
    }
  };

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

      const data = await response.json();
      setCloneSuccess(true);
      
      // Navigate to the cloned notebook after a short delay
      setTimeout(() => {
        navigate(`/workspace/${data.notebook._id}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to clone:', err);
    } finally {
      setIsCloning(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id || !notebook) return;
    
    setIsLiking(true);
    try {
      const result = await likeNotebook(notebook._id, user.id);
      setNotebook(prev => prev ? { 
        ...prev, 
        likes: result.likes,
        likedBy: result.liked 
          ? [...(prev.likedBy || []), user.id]
          : (prev.likedBy || []).filter(id => id !== user.id)
      } : null);
    } catch (err) {
      console.error('Failed to like notebook:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const isLiked = notebook?.likedBy?.includes(user?.id || '');

  // Get notes content based on selected chapter or notebook level
  const getNotesContent = (mode: Mode) => {
    if (selectedChapter && selectedChapter.generatedNotes) {
      return selectedChapter.generatedNotes[mode];
    }
    return notebook?.generatedNotes?.[mode];
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
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/marketplace')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg truncate">{notebook.title}</h1>
            <Badge variant="secondary" className="flex-shrink-0">
              <BookOpen className="h-3 w-3 mr-1" />
              Public
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {notebook.authorName || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 flex-shrink-0"
          onClick={handleLike}
          disabled={!user || isLiking}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          {notebook.likes}
        </Button>

        {/* Copy to Library Button */}
        {user && (
          <Button 
            onClick={handleClone} 
            disabled={isCloning || cloneSuccess}
            variant={cloneSuccess ? "outline" : "default"}
            className="gap-2 flex-shrink-0"
          >
            {cloneSuccess ? (
              <>✓ Copied! Redirecting...</>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {isCloning ? 'Copying...' : 'Copy to Library'}
              </>
            )}
          </Button>
        )}

        {!user && (
          <Button variant="outline" onClick={() => navigate('/sign-in')} className="gap-2 flex-shrink-0">
            Sign in to copy
          </Button>
        )}
      </div>

      {/* Main Content Area - Workspace-like layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Collapsed Sidebar - Show expand button */}
          {sidebarCollapsed && (
            <div className="h-full flex flex-col items-center py-2 px-1 border-r bg-muted/30">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setSidebarCollapsed(false)}
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Left Sidebar - File Explorer & Chapters (Read-only) */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={30}>
                <WorkspaceSidebar
                  sources={notebook.sources}
                  chapters={allChapters}
                  selectedSourceIndex={selectedSourceIndex}
                  selectedChapterId={selectedChapter?._id}
                  onSelectSource={(idx) => {
                    setSelectedSourceIndex(idx);
                    setSelectedChapter(null);
                  }}
                  onSelectChapter={handleChapterSelect}
                  onCollapse={() => setSidebarCollapsed(true)}
                  // No upload, delete, or process handlers - read-only
                />
              </ResizablePanel>

              <ResizableHandle />
            </>
          )}

          {/* Source View */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <SourceViewer 
              sources={notebook.sources}
              selectedIndex={selectedSourceIndex}
              onSelectSource={setSelectedSourceIndex}
              selectedChapter={selectedChapter}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Generated Notes View (Read-only) */}
          <ResizablePanel defaultSize={42} minSize={25}>
            <div className="h-full flex flex-col bg-background">
              {/* Notes Header */}
              <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Generated Notes</span>
                  <Badge variant="secondary" className="text-xs">Read-only</Badge>
                </div>
              </div>

              {/* Chapter Title if selected */}
              {selectedChapter && (
                <div className="px-4 py-2 bg-muted/30 border-b">
                  <p className="text-sm font-medium">{selectedChapter.title}</p>
                  {selectedChapter.startPage && selectedChapter.endPage && (
                    <p className="text-xs text-muted-foreground">
                      Pages {selectedChapter.startPage} - {selectedChapter.endPage}
                    </p>
                  )}
                </div>
              )}

              {/* Mode Tabs */}
              <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as Mode)} className="flex-1 flex flex-col min-h-0">
                <div className="border-b px-4 py-2">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="socrates">Socrates</TabsTrigger>
                    <TabsTrigger value="aristotle">Aristotle</TabsTrigger>
                    <TabsTrigger value="plato">Plato</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {(['socrates', 'aristotle', 'plato'] as Mode[]).map((mode) => {
                    const content = getNotesContent(mode);
                    return (
                      <TabsContent key={mode} value={mode} className="m-0 h-full">
                        {content ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p>No {mode.charAt(0).toUpperCase() + mode.slice(1)} mode notes available</p>
                            <p className="text-xs mt-2">
                              Copy to your library to generate notes
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </div>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default SharedNotebook;
