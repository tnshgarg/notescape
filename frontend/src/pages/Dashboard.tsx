import { useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { 
  Plus, BookOpen, FileText, Clock, MoreHorizontal, Trash2, Globe, Lock,
  Flame, Target, Zap, Brain, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateNotebookModal from '@/components/CreateNotebookModal';
import StatsCard from '@/components/StatsCard';
import StreakCalendar from '@/components/StreakCalendar';
import LevelProgress from '@/components/LevelProgress';
import FlashcardModal from '@/components/FlashcardModal';
import { useNotebooks } from '@/hooks/useNotebook';
import { deleteNotebook } from '@/lib/notebookApi';
import { formatDistanceToNow, startOfWeek, isWithinInterval, subDays } from 'date-fns';

// Helper to check if a notebook has any generated notes
const hasGeneratedNotes = (notebook: any) => {
  const modes = ['socrates', 'aristotle', 'plato'] as const;
  
  return modes.some(mode => {
    // Check notebook level
    if (notebook.generatedNotes?.[mode]?.trim()) return true;

    // Check chapter level
    return notebook.sources?.some((source: any) => 
      source.chapters?.some((chapter: any) => 
        chapter.generatedNotes?.[mode]?.trim()
      )
    );
  });
};

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

const Dashboard = () => {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const { notebooks, loading, setNotebooks } = useNotebooks(user?.id || '');

  const handleDelete = async (notebookId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this notebook?')) {
      try {
        await deleteNotebook(notebookId);
        setNotebooks(prev => prev.filter(n => n._id !== notebookId));
      } catch (error) {
        console.error('Failed to delete notebook:', error);
      }
    }
  };

  // REAL stats calculated directly from notebook data
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    
    // Notebooks with any notes generated
    const notebooksWithNotes = notebooks.filter(hasGeneratedNotes);
    
    // Topics learned this week: notebooks that have notes AND were accessed this week
    const topicsThisWeek = notebooks.filter(n => {
      const lastAccessed = new Date(n.lastAccessed);
      return hasGeneratedNotes(n) && isWithinInterval(lastAccessed, { start: weekStart, end: now });
    }).length;

    // Total topics = notebooks with any generated notes
    const totalTopics = notebooksWithNotes.length;

    // Total sources across all notebooks
    const totalSources = notebooks.reduce((sum, n) => sum + n.sources.length, 0);

    // XP Calculation:
    // - 50 XP per notebook created
    // - 100 XP per topic with notes
    // - 30 XP per source uploaded
    const xp = (notebooks.length * 50) + (totalTopics * 100) + (totalSources * 30);

    // Calculate streak from notebook activity dates
    const activityDates = new Set<string>();
    notebooks.forEach(n => {
      activityDates.add(new Date(n.createdAt).toDateString());
      activityDates.add(new Date(n.lastAccessed).toDateString());
    });

    // Count consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    for (let i = 0; i <= 365; i++) {
      const checkDate = subDays(today, i);
      if (activityDates.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        // Allow skipping today if not yet active
        break;
      }
    }

    // Generate activity data for streak calendar from actual notebook dates
    const activityData = Array.from({ length: 84 }, (_, i) => {
      const date = subDays(now, 83 - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count notebooks created or accessed on this day
      const count = notebooks.filter(n => {
        const created = new Date(n.createdAt).toDateString();
        const accessed = new Date(n.lastAccessed).toDateString();
        return created === date.toDateString() || accessed === date.toDateString();
      }).length;
      
      return { date: dateStr, count };
    });

    return {
      topicsThisWeek,
      totalTopics,
      totalSources,
      xp,
      streak,
      activityData
    };
  }, [notebooks]);

  // Generate flashcards from notebooks that have Socrates notes
  const flashcards = useMemo(() => {
    const cards: { id: string; front: string; back: string }[] = [];
    
    notebooks.forEach(notebook => {
      // 1. Check notebook-level notes
      const notebookContent = notebook.generatedNotes?.socrates?.trim();
      if (notebookContent && notebookContent.length > 50) {
        const sentences = notebookContent
          .split(/(?<=[.!?])\s+/)
          .filter(s => s.trim().length > 30 && s.trim().length < 300)
          .slice(0, 3);
        
        sentences.forEach((sentence, idx) => {
          cards.push({
            id: `${notebook._id}-main-${idx}`,
            front: `From "${notebook.title}": What is a key concept?`,
            back: sentence.trim()
          });
        });
      }

      // 2. Check chapter-level notes
      if (notebook.sources) {
        notebook.sources.forEach((source: any) => {
          if (source.chapters) {
            source.chapters.forEach((chapter: any) => {
              const chapterContent = chapter.generatedNotes?.socrates?.trim();
              if (chapterContent && chapterContent.length > 50) {
                const sentences = chapterContent
                  .split(/(?<=[.!?])\s+/)
                  .filter((s: string) => s.trim().length > 30 && s.trim().length < 300)
                  .slice(0, 2); // Take 2 per chapter to avoid overcrowding
                
                sentences.forEach((sentence: string, idx: number) => {
                  cards.push({
                    id: `${notebook._id}-${chapter._id}-${idx}`,
                    front: `From "${notebook.title}" (${chapter.title}): What is a key concept?`,
                    back: sentence.trim()
                  });
                });
              }
            });
          }
        });
      }
    });
    
    // Shuffle and limit
    return cards.sort(() => Math.random() - 0.5).slice(0, 15);
  }, [notebooks]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {notebooks.length === 0 
                ? 'Create your first notebook to get started' 
                : `${notebooks.length} notebook${notebooks.length !== 1 ? 's' : ''} in your workspace`
              }
            </p>
          </div>
          
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
        </div>
      </header>

      {/* Gamification Section */}
      <section className="mb-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatsCard
            title="Topics This Week"
            value={loading ? '...' : stats.topicsThisWeek}
            subtitle="Studied recently"
            icon={BookMarked}
            trend={stats.topicsThisWeek > 0 ? { value: stats.topicsThisWeek * 10, isPositive: true } : undefined}
            colorClass="from-violet-500/10 via-violet-500/5 to-transparent"
          />
          <StatsCard
            title="Total Topics"
            value={loading ? '...' : stats.totalTopics}
            subtitle="Notes generated"
            icon={Target}
            colorClass="from-emerald-500/10 via-emerald-500/5 to-transparent"
          />
          <StatsCard
            title="Sources Studied"
            value={loading ? '...' : stats.totalSources}
            subtitle="PDFs, docs & links"
            icon={FileText}
            colorClass="from-amber-500/10 via-amber-500/5 to-transparent"
          />
          <StatsCard
            title="Experience"
            value={loading ? '...' : `${stats.xp} XP`}
            subtitle="Keep learning!"
            icon={Zap}
            colorClass="from-pink-500/10 via-pink-500/5 to-transparent"
          />
        </div>

        {/* Level & Streak Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Level Progress Card */}
          <div className="rounded-xl border bg-card p-5">
            <LevelProgress xp={stats.xp} level={1} />
          </div>

          {/* Streak Calendar Card */}
          <div className="rounded-xl border bg-card p-5">
            <StreakCalendar activityData={stats.activityData} weeks={12} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50"
            onClick={() => setShowFlashcardModal(true)}
            disabled={flashcards.length === 0}
          >
            <Brain className="h-4 w-4 text-violet-500" />
            Study Flashcards
            {flashcards.length > 0 && (
              <Badge variant="secondary" className="ml-1">{flashcards.length}</Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50"
            asChild
          >
            <Link to="/library">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              View Library
            </Link>
          </Button>

          {stats.streak >= 3 && (
            <Badge className="gap-1 bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 border-0">
              <Flame className="h-3 w-3" />
              {stats.streak} day streak!
            </Badge>
          )}
        </div>
      </section>

      {/* Notebooks List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Recent Notebooks
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Loading notebooks...</p>
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No notebooks yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Get started by creating your first notebook. Upload PDFs, documents, or links to generate AI-powered notes.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Notebook
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Sources</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">Last Accessed</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notebooks.map((notebook) => {
                  const completedModes = countCompletedModes(notebook);
                  const progress = Math.round((completedModes / 3) * 100);

                  return (
                    <tr key={notebook._id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/workspace/${notebook._id}`} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {notebook.title}
                            </p>
                            {notebook.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-md">
                                {notebook.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDistanceToNow(new Date(notebook.lastAccessed), { addSuffix: true })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {notebook.isPublic ? (
                          <Badge variant="secondary" className="gap-1 text-xs font-normal">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs font-normal">
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/workspace/${notebook._id}`}>
                                  Open
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => handleDelete(notebook._id, e)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Notebook Modal */}
      <CreateNotebookModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />

      {/* Flashcard Modal */}
      <FlashcardModal
        open={showFlashcardModal}
        onOpenChange={setShowFlashcardModal}
        flashcards={flashcards}
        onComplete={(results) => {
          console.log('Flashcard session complete:', results);
        }}
      />
    </div>
  );
};

export default Dashboard;
