import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, Folder, ChevronRight, 
  Zap, Flame, Target, BookOpen, FileText, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/StatsCard';
import StreakCalendar from '@/components/StreakCalendar';
import LevelProgress from '@/components/LevelProgress';
import { 
  fetchSubjects, fetchProgress, fetchTeachers,
  type NstSubject, type NstProgress, type TeacherPersona,
  getSubjectCompletionPercent
} from '@/lib/nstApi';
import { subDays } from 'date-fns';

const NstDashboard = () => {
  const { user } = useUser();
  const [subjects, setSubjects] = useState<NstSubject[]>([]);
  const [progress, setProgress] = useState<NstProgress[]>([]);
  const [teachers, setTeachers] = useState<TeacherPersona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, teachersData, progressData] = await Promise.all([
        fetchSubjects(user?.id),
        fetchTeachers(),
        user?.id ? fetchProgress(user.id) : Promise.resolve([])
      ]);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load NST data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForSubject = (subjectId: string) => {
    return progress.find(p => p.subjectId === subjectId);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const totalXp = progress.reduce((sum, p) => sum + (p.totalXp || 0), 0);
    const currentStreak = Math.max(...progress.map(p => p.currentStreak || 0), 0);
    const completedNotes = progress.reduce((sum, p) => sum + (p.completedNotes || 0), 0);
    const totalNotes = subjects.reduce((sum, s) => sum + s.totalNotes, 0);
    
    // Generate activity data for streak calendar
    const activityData = Array.from({ length: 84 }, (_, i) => {
      const date = subDays(new Date(), 83 - i);
      const dateStr = date.toISOString().split('T')[0];
      // Simulate some activity based on progress
      const count = progress.some(p => {
        const lastActive = new Date((p as any).updatedAt || Date.now());
        return lastActive.toDateString() === date.toDateString();
      }) ? 1 : 0;
      return { date: dateStr, count };
    });

    return { totalXp, currentStreak, completedNotes, totalNotes, activityData };
  }, [progress, subjects]);

  // Find continue learning - most recent subject with incomplete notes
  const continueSubject = useMemo(() => {
    const subjectsWithProgress = subjects.map(subject => {
      const subjectProgress = getProgressForSubject(subject._id);
      const completed = subjectProgress?.completedNotes || 0;
      const inProgress = subjectProgress?.noteProgress?.some(np => np.started && !np.completed);
      return { subject, completed, inProgress, total: subject.totalNotes };
    }).filter(s => s.completed < s.total || s.inProgress);
    
    return subjectsWithProgress[0]?.subject;
  }, [subjects, progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-primary" />
              NST Learning
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your university subjects & personalized learning
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid - Same style as Dashboard */}
      <section className="mb-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatsCard
            title="Day Streak"
            value={loading ? '...' : stats.currentStreak}
            subtitle="Keep it going!"
            icon={Flame}
            colorClass="from-orange-500/10 via-orange-500/5 to-transparent"
          />
          <StatsCard
            title="Total XP"
            value={loading ? '...' : stats.totalXp}
            subtitle="Experience earned"
            icon={Zap}
            colorClass="from-yellow-500/10 via-yellow-500/5 to-transparent"
          />
          <StatsCard
            title="Notes Completed"
            value={loading ? '...' : `${stats.completedNotes}/${stats.totalNotes}`}
            subtitle="Keep learning!"
            icon={Target}
            colorClass="from-green-500/10 via-green-500/5 to-transparent"
          />
          <StatsCard
            title="Subjects"
            value={loading ? '...' : subjects.length}
            subtitle="Available courses"
            icon={BookOpen}
            colorClass="from-blue-500/10 via-blue-500/5 to-transparent"
          />
        </div>

        {/* Level & Streak Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <LevelProgress xp={stats.totalXp} level={1} />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <StreakCalendar activityData={stats.activityData} weeks={12} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {continueSubject && (
            <Button 
              className="gap-2"
              asChild
            >
              <Link to={`/nst/subject/${continueSubject._id}`}>
                <Play className="h-4 w-4" />
                Continue: {continueSubject.name}
              </Link>
            </Button>
          )}
          


          {stats.currentStreak >= 3 && (
            <Badge className="gap-1 bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 border-0">
              <Flame className="h-3 w-3" />
              {stats.currentStreak} day streak!
            </Badge>
          )}
        </div>
      </section>

      {/* Subjects Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            Your Subjects
          </h2>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Your university subjects will appear here once they're synced.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">XP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Semester</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map(subject => {
                  const subjectProgress = getProgressForSubject(subject._id);
                  const completionPercent = getSubjectCompletionPercent(subject, subjectProgress);
                  const completedNotes = subjectProgress?.completedNotes || 0;
                  const xpEarned = subjectProgress?.totalXp || 0;

                  return (
                    <tr key={subject._id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/nst/subject/${subject._id}`} className="flex items-center gap-3">
                          <div 
                            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${subject.color}20` }}
                          >
                            {subject.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {subject.name}
                            </p>
                            {subject.code && (
                              <p className="text-xs text-muted-foreground">{subject.code}</p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {completedNotes}/{subject.totalNotes}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${completionPercent}%`,
                                backgroundColor: subject.color 
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{completionPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Zap className={`h-3.5 w-3.5 ${xpEarned > 0 ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                          <span className={xpEarned > 0 ? 'font-medium' : 'text-muted-foreground'}>
                            {xpEarned}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {subject.semester && (
                          <Badge variant="outline" className="text-xs font-normal">
                            Sem {subject.semester}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Teachers Section */}
      {teachers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            👨‍🏫 Your Teachers
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {teachers.map(teacher => (
              <div 
                key={teacher._id}
                className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors"
                style={{ borderColor: `${teacher.accentColor}30` }}
              >
                <span className="text-3xl">{teacher.avatar}</span>
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{teacher.style} style</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Select a teacher when studying to learn in their unique style
          </p>
        </section>
      )}
    </div>
  );
};

export default NstDashboard;
