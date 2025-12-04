import { useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { 
  Clock, FileText, BookOpen, Filter, ArrowUpDown, 
  Layers, ChevronDown, ChevronRight,
  Sparkles, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotebooks } from '@/hooks/useNotebook';
import { formatDistanceToNow } from 'date-fns';

type SortOption = 'recent' | 'sources' | 'name';
type GroupOption = 'none' | 'category';

// Helper to count completed modes for a notebook  
const countCompletedModes = (notebook: any) => {
  const modes = ['socrates', 'aristotle', 'plato'] as const;
  let count = 0;

  modes.forEach(mode => {
    // Check notebook level
    if (notebook.generatedNotes?.[mode]?.trim()) {
      count++;
      return;
    }

    // Check chapter level
    const hasChapterNote = notebook.sources?.some((source: any) => 
      source.chapters?.some((chapter: any) => 
        chapter.generatedNotes?.[mode]?.trim()
      )
    );

    if (hasChapterNote) {
      count++;
    }
  });

  return count;
};

// Helper to get progress percentage
const getProgress = (notebook: any) => {
  return Math.round((countCompletedModes(notebook) / 3) * 100);
};

const Library = () => {
  const { user } = useUser();
  const { notebooks, loading } = useNotebooks(user?.id || '');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Sort notebooks
  const sortedNotebooks = useMemo(() => {
    return [...notebooks].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
        case 'sources':
          return b.sources.length - a.sources.length;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [notebooks, sortBy]);

  // Group notebooks by category
  const groupedNotebooks = useMemo(() => {
    if (groupBy === 'none') return { 'All Notebooks': sortedNotebooks };
    
    return sortedNotebooks.reduce((acc, notebook) => {
      const key = notebook.category || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(notebook);
      return acc;
    }, {} as Record<string, typeof sortedNotebooks>);
  }, [sortedNotebooks, groupBy]);

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Stats calculations - directly from notebooks
  const totalSources = notebooks.reduce((sum, n) => sum + n.sources.length, 0);
  const avgProgress = notebooks.length > 0 
    ? Math.round(notebooks.reduce((sum, n) => sum + getProgress(n), 0) / notebooks.length)
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your personal knowledge collection
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Most Recent
                  {sortBy === 'recent' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('sources')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Most Sources
                  {sortBy === 'sources' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Name A-Z
                  {sortBy === 'name' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Group Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Group
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setGroupBy('none')}>
                  <Layers className="h-4 w-4 mr-2" />
                  No Grouping
                  {groupBy === 'none' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy('category')}>
                  <Filter className="h-4 w-4 mr-2" />
                  By Category
                  {groupBy === 'category' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border p-5">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <BookOpen className="h-16 w-16 text-violet-500" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Notebooks</p>
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{notebooks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">In your collection</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border p-5">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <FileText className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Sources</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalSources}</p>
              <p className="text-xs text-muted-foreground mt-1">PDFs, docs & links</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border p-5">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Target className="h-16 w-16 text-amber-500" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Progress</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground mt-1">Notes generated</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading your library...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-gradient-to-b from-muted/20 to-transparent">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-violet-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Your library is empty</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Start by creating notebooks from the Dashboard. Your learning journey awaits!
          </p>
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Sparkles className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotebooks).map(([group, groupNotebooks]) => (
            <div key={group}>
              {/* Group Header (only if grouping is enabled) */}
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleGroup(group)}
                  className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {collapsedGroups.has(group) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {group}
                  <Badge variant="secondary" className="ml-2">
                    {groupNotebooks.length}
                  </Badge>
                </button>
              )}

              {/* Bento Grid of Notebooks */}
              {!collapsedGroups.has(group) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupNotebooks.map((notebook, index) => {
                    const progress = getProgress(notebook);
                    // Create varied card sizes for visual interest
                    const isLarge = index === 0 || (index % 5 === 0 && groupNotebooks.length > 3);
                    
                    return (
                      <Link
                        key={notebook._id}
                        to={`/workspace/${notebook._id}`}
                        className={`group relative overflow-hidden rounded-xl border bg-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 ${
                          isLarge ? 'md:col-span-2 lg:col-span-2' : ''
                        }`}
                      >


                        <div className={`p-5 ${isLarge ? 'md:p-6' : ''}`}>
                          {/* Header with icon */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center ${
                              isLarge ? 'w-14 h-14' : 'w-12 h-12'
                            }`}>
                              <FileText className={`text-red-500 ${isLarge ? 'h-7 w-7' : 'h-5 w-5'}`} />
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex items-center gap-2">
                              {progress === 100 && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              )}
                              {notebook.isPublic && (
                                <Badge variant="secondary" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Title & Description */}
                          <div className="mb-4">
                            <h3 className={`font-semibold group-hover:text-primary transition-colors line-clamp-1 ${
                              isLarge ? 'text-xl' : 'text-lg'
                            }`}>
                              {notebook.title}
                            </h3>
                            {notebook.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notebook.description}
                              </p>
                            )}
                          </div>

                          {/* Progress indicator */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">Learning Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 pt-4 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDistanceToNow(new Date(notebook.lastAccessed), { addSuffix: true })}</span>
                            </div>
                            {notebook.category && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {notebook.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
