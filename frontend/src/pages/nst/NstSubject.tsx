import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  ChevronRight, Play, CheckCircle2, FileText,
  Zap, Search, ArrowLeft, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  fetchSubject, fetchProgress,
  type NstSubject, type NstProgress,
  getSubjectCompletionPercent
} from '@/lib/nstApi';

const NstSubjectPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useUser();
  const [subject, setSubject] = useState<NstSubject | null>(null);
  const [progress, setProgress] = useState<NstProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [subjectId, user?.id]);

  const loadData = async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const [subjectData, progressData] = await Promise.all([
        fetchSubject(subjectId),
        user?.id ? fetchProgress(user.id, subjectId) : Promise.resolve([])
      ]);
      setSubject(subjectData);
      setProgress(progressData[0] || null);
    } catch (error) {
      console.error('Failed to load subject:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!subject) return [];
    if (!searchQuery.trim()) return subject.notes;
    
    const query = searchQuery.toLowerCase();
    return subject.notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.description?.toLowerCase().includes(query)
    );
  }, [subject, searchQuery]);

  const isNoteCompleted = (noteId: string) => {
    return progress?.noteProgress.some(np => 
      np.noteId === noteId && np.completed
    ) || false;
  };

  const getNoteProgress = (noteId: string) => {
    return progress?.noteProgress.find(np => np.noteId === noteId);
  };

  const completionPercent = useMemo(() => {
    if (!subject) return 0;
    return getSubjectCompletionPercent(subject, progress || undefined);
  }, [subject, progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Subject not found</p>
        <Link to="/nst">
          <Button variant="outline">Back to NST Learning</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/nst" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          NST Learning
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{subject.name}</span>
      </div>

      {/* Subject Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="text-4xl p-4 rounded-xl"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              {subject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{subject.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {subject.code && (
                  <Badge variant="secondary">{subject.code}</Badge>
                )}
                <span className="text-muted-foreground text-sm">
                  {subject.totalNotes} lectures
                </span>
              </div>
            </div>
          </div>

          {/* Completion Ring */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke={subject.color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${completionPercent * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-bold">{completionPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress?.completedNotes || 0}/{subject.totalNotes} Completed
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lectures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Notes Table */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Lecture</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 text-center">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 text-center">XP Earned</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No lectures match your search' : 'No lectures in this subject yet'}
                </td>
              </tr>
            ) : (
              filteredNotes.sort((a, b) => a.order - b.order).map(note => {
                const completed = isNoteCompleted(note._id);
                const noteProgress = getNoteProgress(note._id);
                const xpEarned = noteProgress?.xpEarned || 0;
                const multiplier = noteProgress?.xpMultiplier || 1;

                return (
                  <tr 
                    key={note._id}
                    className={`group hover:bg-muted/30 transition-colors ${completed ? 'bg-green-500/5' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <Link 
                        to={`/nst/study/${subject._id}/${note._id}`}
                        className="flex items-start gap-3"
                      >
                        <div className={`mt-0.5 ${completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {note.title}
                          </p>
                          {note.hasAttachment && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <FileText className="h-3 w-3" />
                              Notes Included
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {completed ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          ✓ Done
                        </Badge>
                      ) : noteProgress?.started ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                          In Progress
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {multiplier > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {multiplier}x
                          </Badge>
                        )}
                        <Zap className={`h-4 w-4 ${xpEarned > 0 ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                        <span className={xpEarned > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {xpEarned}/{note.xpValue}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/nst/study/${subject._id}/${note._id}`}>
                        <Button size="sm" variant={completed ? 'outline' : 'default'}>
                          {completed ? 'Review' : 'Start'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Card */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{progress.totalXp}</p>
                <p className="text-sm text-muted-foreground">XP Earned</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{progress.completedNotes}</p>
                <p className="text-sm text-muted-foreground">Notes Done</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl mb-2">🔥</p>
                <p className="text-2xl font-bold">{progress.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NstSubjectPage;
