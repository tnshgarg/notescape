import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Columns2, FileText, Settings, Globe, Lock, Share2, Copy, Check, PanelLeft, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import SourceViewer from '@/components/SourceViewer';
import NoteViewer from '@/components/NoteViewer';
import AIAssistant from '@/components/AIAssistant';
import WorkspaceSidebar from '@/components/WorkspaceSidebar';
import ApiKeyDialog from '@/components/ApiKeyDialog';
import { useApiKey } from '@/hooks/useApiKey';
import { useNotebook } from '@/hooks/useNotebook';
import { updateNotebook, processChapters, type Notebook, type Chapter } from '@/lib/notebookApi';

type ViewMode = 'split' | 'book';

const Workspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasApiKey, apiKey } = useApiKey();
  const { notebook, loading, setNotebook } = useNotebook(id);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Track if we've already auto-adjusted for the current source's orientation
  // This prevents locking the user into a view if they want to change it back
  const hasAdjustedForOrientation = useRef(false);

  // Reset adjustment flag when source changes
  useEffect(() => {
    hasAdjustedForOrientation.current = false;
  }, [selectedSourceIndex, notebook?._id]);

  useEffect(() => {
    if (!hasApiKey()) {
      setShowApiKeyDialog(true);
    }
  }, [hasApiKey]);

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

  // Get context for AI - use selected chapter if available, otherwise full source
  const getNotebookContext = useCallback(() => {
    if (selectedChapter) {
      return selectedChapter.content;
    }
    if (!notebook?.sources) return '';
    return notebook.sources
      .map(s => s.content || '')
      .filter(Boolean)
      .join('\n\n---\n\n');
  }, [notebook, selectedChapter]);

  const handleNotebookUpdate = (updatedNotebook: Notebook) => {
    setNotebook(updatedNotebook);
    
    // Also update selected chapter if it was modified
    if (selectedChapter) {
      // Find the updated chapter in the new notebook data
      for (const source of updatedNotebook.sources) {
        if (source.chapters) {
          const updatedChapter = source.chapters.find(c => c._id === selectedChapter._id);
          if (updatedChapter) {
            setSelectedChapter({
              ...updatedChapter,
              sourceId: source._id || ''
            });
            break;
          }
        }
      }
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    // Find the source index for this chapter
    const sourceIndex = notebook?.sources.findIndex(s => s._id === chapter.sourceId);
    if (sourceIndex !== undefined && sourceIndex >= 0) {
      setSelectedSourceIndex(sourceIndex);
    }
  };

  const handleChapterNavigation = (direction: 'prev' | 'next') => {
    if (!selectedChapter || allChapters.length === 0) return;

    const currentIndex = allChapters.findIndex(c => c._id === selectedChapter._id);
    if (currentIndex === -1) return;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Bounds check
    if (newIndex >= 0 && newIndex < allChapters.length) {
      handleChapterSelect(allChapters[newIndex]);
    }
  };

  const handlePublishToggle = async () => {
    if (!notebook) return;
    try {
      const updated = await updateNotebook(notebook._id, { isPublic: !notebook.isPublic });
      setNotebook(updated);
    } catch (error) {
      console.error('Failed to update publish status:', error);
    }
  };

  const handleProcessChapters = async (sourceId: string) => {
    if (!notebook) return;
    try {
      // Use AI analysis with apiKey if available
      const result = await processChapters(notebook._id, sourceId, apiKey || undefined);
      if (result.success) {
        setNotebook(result.notebook);
        
        // Auto-select the first chapter of the processed source
        if (result.chapters && result.chapters.length > 0) {
          // Find the source in the updated notebook to get the correct IDs
          const updatedSource = result.notebook.sources.find(s => s._id === sourceId);
          if (updatedSource && updatedSource.chapters && updatedSource.chapters.length > 0) {
             const chapterToSelect = {
               ...updatedSource.chapters[0],
               sourceId: sourceId
             };
             handleChapterSelect(chapterToSelect);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process chapters:', error);
      // Show error toast/alert
    }
  };

  const handleOrientationChange = (isLandscape: boolean) => {
    // Only adjust once per source to allow user override
    if (isLandscape && !hasAdjustedForOrientation.current) {
      // For landscape documents, maximize space by closing sidebars
      // But keep the notes visible (Split View) as that's the core product
      setSidebarCollapsed(true);
      setShowAIPanel(false);
      setViewMode('split');
      hasAdjustedForOrientation.current = true;
    }
  };

  // Auto-process new PDF sources
  useEffect(() => {
    if (notebook?.sources) {
      notebook.sources.forEach(source => {
        if (source.type === 'pdf' && !source.isChunked && !source.chapters?.length) {
          handleProcessChapters(source._id!);
        }
      });
    }
  }, [notebook?.sources?.length, apiKey]); // Also trigger when apiKey becomes available

  const shareUrl = notebook ? `${window.location.origin}/shared/${notebook._id}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!notebook) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Notebook not found</h2>
          <p className="text-muted-foreground mb-4">The notebook you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      <ApiKeyDialog 
        open={showApiKeyDialog} 
        onOpenChange={setShowApiKeyDialog} 
      />
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Notebook</DialogTitle>
            <DialogDescription>
              {notebook.isPublic 
                ? 'Your notebook is public. Anyone with the link can view it.'
                : 'Make your notebook public to share it with others.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notebook.isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {notebook.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <Switch 
                checked={notebook.isPublic} 
                onCheckedChange={handlePublishToggle}
              />
            </div>
            
            {notebook.isPublic && (
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="text-sm"
                />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Top Navigation Bar */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg truncate">{notebook.title}</h1>
            {notebook.isPublic ? (
              <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
            {allChapters.length > 0 && ` • ${allChapters.length} chapters`}
            {selectedChapter && ` • Viewing: ${selectedChapter.title}`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
            className="gap-2"
          >
            <Columns2 className="h-4 w-4" />
            Split View
          </Button>
          <Button
            variant={viewMode === 'book' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('book')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Book View
          </Button>
        </div>

        {/* Share Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 flex-shrink-0"
          onClick={() => setShowShareDialog(true)}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Sidebar - File Explorer & Chapters (Collapsible) */}
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

          {/* Left Sidebar - File Explorer & Chapters */}
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
                  onProcessChapters={handleProcessChapters}
                  onCollapse={() => setSidebarCollapsed(true)}
                />
              </ResizablePanel>

              <ResizableHandle />
            </>
          )}

          {/* Content Area - Split or Single View */}
          <ResizablePanel defaultSize={showAIPanel ? 57 : 82} minSize={30}>
            {viewMode === 'split' ? (
              <ResizablePanelGroup direction="horizontal">
                {/* Source View */}
                <ResizablePanel defaultSize={50} minSize={20}>
                  <SourceViewer 
                    sources={notebook.sources}
                    selectedIndex={selectedSourceIndex}
                    onSelectSource={setSelectedSourceIndex}
                    selectedChapter={selectedChapter}
                    onOrientationChange={handleOrientationChange}
                  />
                </ResizablePanel>
                
                <ResizableHandle />
                
                {/* Generated Notes View */}
                <ResizablePanel defaultSize={50} minSize={20}>
                  <NoteViewer 
                    notebook={notebook}
                    sources={notebook.sources}
                    onNotebookUpdate={handleNotebookUpdate}
                    selectedChapter={selectedChapter}
                    onNavigateChapter={handleChapterNavigation}
                    onJumpToChapter={handleChapterSelect}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              // Book View - Single pane
              <div className="h-full">
                <SourceViewer 
                  sources={notebook.sources}
                  selectedIndex={selectedSourceIndex}
                  onSelectSource={setSelectedSourceIndex}
                  selectedChapter={selectedChapter}
                  onOrientationChange={handleOrientationChange}
                />
              </div>
            )}
          </ResizablePanel>
          
          {/* AI Panel - When visible */}
          {showAIPanel && (
            <>
              <ResizableHandle />
              
              {/* Right Sidebar - AI Assistant */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <AIAssistant 
                  onClose={() => setShowAIPanel(false)}
                  notebookContext={getNotebookContext()}
                  notebookTitle={notebook.title}
                  notebookId={notebook._id}
                  chapters={allChapters}
                  selectedChapter={selectedChapter}
                />
              </ResizablePanel>
            </>
          )}

          {/* Collapsed AI Panel - Show expand button */}
          {!showAIPanel && (
            <div className="h-full flex flex-col items-center py-2 px-1 border-l bg-muted/30">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setShowAIPanel(true)}
                title="Open AI Chat"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Workspace;
