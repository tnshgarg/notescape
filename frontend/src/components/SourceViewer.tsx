import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { FileText, Share2, MoreVertical, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Source, Chapter } from '@/lib/notebookApi';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface SourceViewerProps {
  sources: Source[];
  selectedIndex?: number;
  onSelectSource?: (index: number) => void;
  selectedChapter?: Chapter | null;
}

const SourceViewer = ({ sources, selectedIndex = 0, onSelectSource, selectedChapter }: SourceViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  
  const currentSource = sources[currentIndex];
  const hasMultipleSources = sources.length > 1;

  // Determine what content to display
  const displayContent = selectedChapter ? selectedChapter.content : currentSource?.content;
  const displayTitle = selectedChapter ? selectedChapter.title : (currentSource?.filename || 'Untitled Source');
  const isPdf = currentSource?.type === 'pdf';

  useEffect(() => {
    setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  // Reset page number when chapter or source changes
  useEffect(() => {
    if (selectedChapter && selectedChapter.startPage) {
      setPageNumber(selectedChapter.startPage);
    } else {
      setPageNumber(1);
    }
  }, [selectedChapter, currentSource]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : sources.length - 1;
    setCurrentIndex(newIndex);
    onSelectSource?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < sources.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onSelectSource?.(newIndex);
  };

  const handlePageChange = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      
      // If viewing a chapter, constrain to chapter pages
      if (selectedChapter && selectedChapter.startPage && selectedChapter.endPage) {
        if (newPage < selectedChapter.startPage) return selectedChapter.startPage;
        if (newPage > selectedChapter.endPage) return selectedChapter.endPage;
        return newPage;
      }
      
      // Otherwise constrain to document pages
      if (newPage < 1) return 1;
      if (numPages && newPage > numPages) return numPages;
      
      return newPage;
    });
  };

  if (!sources || sources.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="h-14 border-b flex items-center justify-center px-4">
          <span className="text-muted-foreground">No sources available</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add some sources to your notebook to view them here.</p>
          </div>
        </div>
      </div>
    );
  }

  const isMarkdown = currentSource?.type === 'markdown' || currentSource?.filename?.endsWith('.md');

  // Determine page range for display
  const startPage = selectedChapter?.startPage || 1;
  const endPage = selectedChapter?.endPage || numPages || 1;
  const isFirstPage = pageNumber <= startPage;
  const isLastPage = pageNumber >= endPage;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium text-sm truncate">
            {currentSource?.filename || 'Untitled'}
          </span>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {currentSource?.type || 'text'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPdf && (
            <div className="flex items-center gap-1 mr-2 bg-muted/50 rounded-md px-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          )}

          {hasMultipleSources && (
            <div className="flex items-center gap-1 mr-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                {currentIndex + 1} / {sources.length}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Source Tabs (if multiple) */}
      {hasMultipleSources && (
        <div className="border-b px-4 py-2 overflow-x-auto flex-shrink-0">
          <div className="flex gap-2">
            {sources.map((source, idx) => (
              <Button
                key={source._id || idx}
                variant={idx === currentIndex ? 'default' : 'outline'}
                size="sm"
                className="text-xs whitespace-nowrap"
                onClick={() => {
                  setCurrentIndex(idx);
                  onSelectSource?.(idx);
                }}
              >
                {source.filename}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-muted/10 relative">
        {isPdf && currentSource?.content ? (
          <div className="flex flex-col items-center p-4 min-h-full">
            {/* PDF Navigation Overlay */}
            <div className="sticky top-2 z-10 bg-background/80 backdrop-blur-sm border shadow-sm rounded-full px-4 py-1 flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                disabled={isFirstPage}
                onClick={() => handlePageChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                Page {pageNumber} {selectedChapter?.endPage ? `of ${selectedChapter.endPage}` : (numPages ? `of ${numPages}` : '')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                disabled={isLastPage}
                onClick={() => handlePageChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* PDF Document */}
            <div className="shadow-lg">
              {currentSource.pdfData ? (
                <Document
                  file={currentSource.pdfData}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-[600px] w-[400px] bg-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-[400px] w-full bg-white p-8 text-center text-destructive">
                      <p>Failed to load PDF.</p>
                      <p className="text-sm text-muted-foreground mt-2">The file might be corrupted or too large.</p>
                    </div>
                  }
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="bg-white"
                    width={Math.min(800, window.innerWidth * 0.4)}
                  />
                </Document>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6 bg-background p-8 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 p-3 rounded-md">
                    <FileText className="h-4 w-4" />
                    <p className="text-sm">PDF not available for viewing. This may be an older upload. Please re-upload the PDF to enable viewing.</p>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
                      {displayContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {selectedChapter ? 'Chapter View' : 'Source View'}
                </Badge>
                {selectedChapter && (
                  <Badge variant="outline" className="text-xs">
                    {selectedChapter.wordCount || 0} words
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight">
                {displayTitle}
              </h1>
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {displayContent ? (
                  isMarkdown ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
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
                        a: ({href, children}) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                      }}
                    >
                      {displayContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm bg-muted/30 p-4 rounded-lg">
                      {displayContent}
                    </div>
                  )
                ) : currentSource?.url ? (
                  <div>
                    <p className="text-muted-foreground">External URL:</p>
                    <a 
                      href={currentSource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {currentSource.url}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    No content available for this source.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceViewer;
