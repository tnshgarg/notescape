import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, 
  FolderOpen, 
  BookOpen, 
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  Circle,
  Sparkles,
  PanelLeftClose
} from 'lucide-react';
import type { Source, Chapter } from '@/lib/notebookApi';

interface WorkspaceSidebarProps {
  sources: Source[];
  chapters: Chapter[];
  selectedSourceIndex: number;
  selectedChapterId?: string;
  onSelectSource: (index: number) => void;
  onSelectChapter: (chapter: Chapter) => void;
  onUploadClick?: () => void;
  onDeleteSource?: (sourceId: string) => void;
  onProcessChapters?: (sourceId: string) => void;
  onCollapse?: () => void;
}

const WorkspaceSidebar = ({ 
  sources, 
  chapters,
  selectedSourceIndex,
  selectedChapterId,
  onSelectSource,
  onSelectChapter,
  onUploadClick,
  onDeleteSource,
  onProcessChapters,
  onCollapse
}: WorkspaceSidebarProps) => {
  const [activeTab, setActiveTab] = useState<'files' | 'chapters'>('chapters');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'markdown':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'youtube':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'url':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group chapters by source
  const chaptersBySource = chapters.reduce((acc, chapter) => {
    const sourceId = chapter.sourceId || 'unknown';
    if (!acc[sourceId]) {
      acc[sourceId] = [];
    }
    acc[sourceId].push(chapter);
    return acc;
  }, {} as Record<string, Chapter[]>);

  // Calculate progress
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => 
    c.generatedNotes && (c.generatedNotes.socrates || c.generatedNotes.aristotle || c.generatedNotes.plato)
  ).length;
  const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header with Collapse Button */}
      <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Sources</span>
        </div>
        <div className="flex items-center gap-1">
          {onUploadClick && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUploadClick}>
              <Upload className="h-4 w-4" />
            </Button>
          )}
          {onCollapse && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={onCollapse}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'files' | 'chapters')} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 mx-0 rounded-none border-b bg-transparent h-10">
          <TabsTrigger 
            value="chapters"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Chapters
          </TabsTrigger>
          <TabsTrigger 
            value="files" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <FileText className="h-4 w-4 mr-2" />
            Files
          </TabsTrigger>
          
        </TabsList>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 overflow-y-auto m-0 p-0">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No sources added yet</p>
              {onUploadClick && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sources.map((source, idx) => (
                <div 
                  key={source._id || idx}
                  className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                    idx === selectedSourceIndex ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelectSource(idx)}
                >
                  {getFileIcon(source.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{source.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {source.type}
                      </Badge>
                      {source.size && (
                        <span>{formatFileSize(source.size)}</span>
                      )}
                      {source.pageCount && (
                        <span>{source.pageCount} pages</span>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSource(idx);
                      }}
                      title="View source"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {onDeleteSource && source._id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSource(source._id!);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Chapters Tab */}
        <TabsContent value="chapters" className="flex-1 overflow-y-auto m-0 p-0">
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No chapters extracted yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Process your sources to automatically extract chapters and sections.
              </p>
              {onProcessChapters && sources.length > 0 && (
                <Button onClick={() => onProcessChapters(sources[0]._id!)} size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analyze & Extract Chapters
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Progress Bar */}
              <div className="p-4 border-b bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {completedChapters} of {totalChapters} chapters completed
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {sources.map((source, sourceIdx) => {
                  const sourceChapters = chaptersBySource[source._id || ''] || [];
                  if (sourceChapters.length === 0) return null;
                  
                  return (
                    <div key={source._id || sourceIdx}>
                      <div className="flex items-center gap-2 px-2 py-1">
                        {getFileIcon(source.type)}
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {source.filename}
                        </span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {sourceChapters.sort((a, b) => a.order - b.order).map((chapter) => {
                          const hasNotes = chapter.generatedNotes && (
                            chapter.generatedNotes.socrates || 
                            chapter.generatedNotes.aristotle || 
                            chapter.generatedNotes.plato
                          );

                          return (
                            <div
                              key={chapter._id}
                              className={`flex items-center gap-2 p-2 pl-6 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedChapterId === chapter._id ? 'bg-muted' : ''
                              }`}
                              onClick={() => onSelectChapter(chapter)}
                            >
                              {hasNotes ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${selectedChapterId === chapter._id ? 'font-medium' : ''}`}>
                                  {chapter.title}
                                </p>
                                {(chapter.startPage || chapter.endPage) && (
                                  <span className="text-xs text-muted-foreground">
                                    Pages {chapter.startPage}-{chapter.endPage}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkspaceSidebar;
