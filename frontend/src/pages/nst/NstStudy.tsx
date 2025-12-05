import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  ChevronLeft, ChevronRight, FileText, Send,
  Sparkles, MessageCircle, Compass, BookOpen, CheckCircle2, 
  RefreshCw, Play, GraduationCap, Loader2
} from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiKey } from '@/hooks/useApiKey';
import ApiKeyDialog from '@/components/ApiKeyDialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchNote, fetchTeachers, updateProgress, generateStudyNotes, chatWithTeacher, generateQuiz,
  type NstNote, type TeacherPersona, type Difficulty, type QuizQuestion
} from '@/lib/nstApi';

interface ChatMessage {
  role: 'user' | 'teacher';
  content: string;
  teacherName?: string;
}

interface ExploreItem {
  question: string;
  answer: string;
  expanded: boolean;
}

// Mode descriptions matching main workspace theme
const difficultyInfo = {
  easy: { title: 'Easy', description: 'Simple & clear', icon: Sparkles, color: 'text-violet-500' },
  medium: { title: 'Medium', description: 'Balanced depth', icon: BookOpen, color: 'text-emerald-500' },
  advanced: { title: 'Advanced', description: 'Deep dive', icon: GraduationCap, color: 'text-amber-500' }
};

// Custom markdown components - matching NoteViewer
const MarkdownComponents = {
  h1: ({children}: {children?: React.ReactNode}) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
  h2: ({children}: {children?: React.ReactNode}) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
  h3: ({children}: {children?: React.ReactNode}) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
  p: ({children}: {children?: React.ReactNode}) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({children}: {children?: React.ReactNode}) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
  ol: ({children}: {children?: React.ReactNode}) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
  li: ({children}: {children?: React.ReactNode}) => <li className="leading-relaxed">{children}</li>,
  code: ({className, children, ...props}: {className?: string; children?: React.ReactNode}) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
    ) : (
      <code className={`${className} block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono`} {...props}>{children}</code>
    );
  },
  pre: ({children}: {children?: React.ReactNode}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
  blockquote: ({children}: {children?: React.ReactNode}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">{children}</blockquote>,
  table: ({children}: {children?: React.ReactNode}) => <div className="overflow-x-auto mb-4"><table className="w-full border-collapse border border-border">{children}</table></div>,
  th: ({children}: {children?: React.ReactNode}) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>,
  td: ({children}: {children?: React.ReactNode}) => <td className="border border-border px-4 py-2">{children}</td>,
  hr: () => <hr className="my-6 border-border" />,
  a: ({href, children}: {href?: string; children?: React.ReactNode}) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  strong: ({children}: {children?: React.ReactNode}) => <strong className="font-semibold">{children}</strong>,
  em: ({children}: {children?: React.ReactNode}) => <em className="italic">{children}</em>,
};

const NstStudy = () => {
  const { subjectId, noteId } = useParams<{ subjectId: string; noteId: string }>();
  const { user } = useUser();
  const { apiKey, hasApiKey } = useApiKey();
  
  // Dialog state
  const [showApiDialog, setShowApiDialog] = useState(false);
  
  // Data state
  const [note, setNote] = useState<NstNote | null>(null);
  const [subjectInfo, setSubjectInfo] = useState<{ _id: string; name: string; code?: string } | null>(null);
  const [teachers, setTeachers] = useState<TeacherPersona[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current chapter
  const [currentChapter, setCurrentChapter] = useState(0);
  
  // Teacher & difficulty
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherPersona | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Generated content
  const [studyNotes, setStudyNotes] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  
  // Explore mode
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>([]);
  const [generatingExplore, setGeneratingExplore] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Completion tracking
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionXp, setCompletionXp] = useState(0);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    loadData();
  }, [subjectId, noteId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadData = async () => {
    if (!subjectId || !noteId) return;
    try {
      setLoading(true);
      const [noteData, teachersData] = await Promise.all([
        fetchNote(subjectId, noteId),
        fetchTeachers()
      ]);
      setNote(noteData.note);
      setSubjectInfo(noteData.subject);
      setTeachers(teachersData);
      setSelectedTeacher(teachersData.find(t => t.isDefault) || teachersData[0] || null);
      
      // Mark as started
      if (user?.id) {
        updateProgress(user.id, subjectId, noteId, 'start');
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentChapterContent = useCallback(() => {
    if (!note) return '';
    if (note.chapters.length > 0 && note.chapters[currentChapter]) {
      return note.chapters[currentChapter].content;
    }
    return note.content || '';
  }, [note, currentChapter]);

  const handleGenerateNotes = async () => {
    if (!hasApiKey()) {
      setShowApiDialog(true);
      return;
    }
    
    const content = getCurrentChapterContent();
    if (!content) return;
    
    try {
      setGeneratingNotes(true);
      const notes = await generateStudyNotes(
        content,
        difficulty,
        selectedTeacher?._id || null,
        apiKey || ''
      );
      setStudyNotes(notes);
    } catch (error) {
      console.error('Failed to generate notes:', error);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleGenerateExplore = async () => {
    if (!hasApiKey()) {
      setShowApiDialog(true);
      return;
    }
    
    const content = getCurrentChapterContent();
    if (!content) return;
    
    try {
      setGeneratingExplore(true);
      
      const prompt = `Based on this content, generate 5 interesting "explore more" questions. Keep answers SHORT (2-3 sentences max).

Content:
${content.slice(0, 2000)}

Return as JSON array:
[{"question": "...", "answer": "..."}]

Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey || ''
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });
      
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const items = JSON.parse(text) as { question: string; answer: string }[];
      setExploreItems(items.map(item => ({ ...item, expanded: false })));
    } catch (error) {
      console.error('Failed to generate explore content:', error);
    } finally {
      setGeneratingExplore(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !hasApiKey()) {
      if (!hasApiKey()) setShowApiDialog(true);
      return;
    }
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      setSendingChat(true);
      const chatHistory = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      const { reply, teacherName } = await chatWithTeacher(
        userMessage,
        getCurrentChapterContent(),
        selectedTeacher?._id || null,
        chatHistory,
        apiKey || ''
      );
      setChatMessages(prev => [...prev, { role: 'teacher', content: reply, teacherName }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatMessages(prev => [...prev, { 
        role: 'teacher', 
        content: 'Sorry, I encountered an error. Please try again.',
        teacherName: selectedTeacher?.name 
      }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!hasApiKey()) {
      setShowApiDialog(true);
      return;
    }
    
    try {
      setGeneratingQuiz(true);
      setShowQuiz(true);
      const questions = await generateQuiz(
        getCurrentChapterContent(),
        'mcq',
        5,
        apiKey || ''
      );
      setQuizQuestions(questions);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctIndex) correct++;
    });
    
    const score = Math.round((correct / quizQuestions.length) * 100);
    
    if (user?.id && subjectId && noteId) {
      updateProgress(user.id, subjectId, noteId, 'complete_quiz', { score });
    }
  };

  const handleMarkComplete = async () => {
    if (user?.id && subjectId && noteId && !isCompleted) {
      setMarkingComplete(true);
      try {
        const result = await updateProgress(user.id, subjectId, noteId, 'complete_note', {
          difficulty,
          xpValue: note?.xpValue || 30
        });
        setIsCompleted(true);
        setCompletionXp(result.noteProgress?.xpEarned || 30);
      } catch (error) {
        console.error('Failed to mark complete:', error);
      } finally {
        setMarkingComplete(false);
      }
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapter(index);
    setStudyNotes('');
    setChatMessages([]);
    setExploreItems([]);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note || !subjectInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Note not found</p>
        <Link to="/nst">
          <Button variant="outline">Back to NST Learning</Button>
        </Link>
      </div>
    );
  }

  const currentChapterData = note.chapters[currentChapter];
  const hasNotes = studyNotes && studyNotes.trim().length > 0;

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Header - Matching main workspace style */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <Link to={`/nst/subject/${subjectId}`}>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg truncate">{note.title}</h1>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {subjectInfo.name}
            {note.chapters.length > 1 && ` • Chapter ${currentChapter + 1} of ${note.chapters.length}`}
          </p>
        </div>

        {/* Teacher Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Teacher:</span>
          <div className="flex bg-muted/50 p-1 rounded-lg border shadow-sm">
            {teachers.map(teacher => (
              <button
                key={teacher._id}
                onClick={() => setSelectedTeacher(teacher)}
                className={`px-2 py-1 rounded-md text-lg transition-all ${
                  selectedTeacher?._id === teacher._id
                    ? 'bg-background shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'hover:bg-background/50'
                }`}
                title={teacher.name}
              >
                {teacher.avatar}
              </button>
            ))}
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="outline" size="sm" onClick={handleStartQuiz} disabled={generatingQuiz}>
          Test Yourself
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleMarkComplete} 
          disabled={markingComplete || isCompleted}
          className={`gap-1 transition-all ${isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
        >
          {markingComplete ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Completed (+{completionXp} XP)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Source Panel */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full flex flex-col border-r">
              <div className="p-4 border-b flex-shrink-0 bg-muted/5">
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Source Content
                </h2>
                {note.chapters.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentChapterData?.title || `Chapter ${currentChapter + 1}`}
                  </p>
                )}
              </div>
              
              {/* Scrollable Source Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {getCurrentChapterContent()}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Chapter Navigation */}
              {note.chapters.length > 1 && (
                <div className="h-14 border-t flex items-center justify-between px-4 bg-muted/10 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentChapter === 0}
                    onClick={() => goToChapter(currentChapter - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {note.chapters.map((_, idx) => (
                      <Button
                        key={idx}
                        variant={currentChapter === idx ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          currentChapter === idx ? "" : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => goToChapter(idx)}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentChapter === note.chapters.length - 1}
                    onClick={() => goToChapter(currentChapter + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Notes + Explore + Chat */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <Tabs defaultValue="notes" className="h-full flex flex-col">
              <div className="border-b px-4 py-3 flex-shrink-0 space-y-3 bg-muted/5">
                {/* Tabs */}
                <TabsList>
                  <TabsTrigger value="notes">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Study Notes
                  </TabsTrigger>
                  <TabsTrigger value="explore">
                    <Compass className="h-4 w-4 mr-1" />
                    Explore
                  </TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Ask Teacher
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Study Notes Tab */}
              <TabsContent value="notes" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="border-b px-4 py-3 flex-shrink-0 space-y-3 bg-muted/5">
                  {/* Difficulty Selection - Same style as NoteViewer modes */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex bg-muted/50 p-1 rounded-lg border shadow-sm">
                      {(['easy', 'medium', 'advanced'] as Difficulty[]).map((d) => {
                        const isActive = difficulty === d;
                        const Info = difficultyInfo[d];
                        const Icon = Info.icon;
                        
                        return (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
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
                      onClick={handleGenerateNotes} 
                      disabled={generatingNotes}
                      size="sm"
                      className="h-8 px-3 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      {generatingNotes ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="sr-only sm:not-sr-only sm:inline-block">Generating...</span>
                        </>
                      ) : hasNotes ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:inline-block">Regenerate</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:inline-block">Generate</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Description */}
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pl-1">
                    {difficultyInfo[difficulty].description}
                    {selectedTeacher && ` • ${selectedTeacher.name}`}
                  </div>
                </div>

                {/* Scrollable Notes Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="p-6">
                    {hasNotes ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                          {studyNotes}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Study Notes Yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-4">
                          Select a difficulty level and click Generate to create personalized study notes.
                        </p>
                        {selectedTeacher && (
                          <p className="text-sm text-primary">
                            {selectedTeacher.name} is ready to teach you!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Explore Tab */}
              <TabsContent value="explore" className="flex-1 flex flex-col m-0 overflow-hidden">
                <div className="p-4 border-b flex-shrink-0 bg-muted/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Explore Beyond</h3>
                      <p className="text-xs text-muted-foreground">
                        Curious questions to deepen understanding
                      </p>
                    </div>
                    <Button onClick={handleGenerateExplore} disabled={generatingExplore} size="sm">
                      {generatingExplore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Compass className="h-4 w-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Scrollable Explore Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="p-4 space-y-3">
                    {exploreItems.length > 0 ? (
                      exploreItems.map((item, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => {
                            setExploreItems(prev => prev.map((it, i) => 
                              i === index ? { ...it, expanded: !it.expanded } : it
                            ));
                          }}
                        >
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <span className="text-lg">🤔</span>
                              {item.question}
                            </CardTitle>
                          </CardHeader>
                          {item.expanded && (
                            <CardContent className="pt-0 pb-3">
                              <p className="text-sm text-muted-foreground">{item.answer}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Compass className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          Click "Generate" to explore topics
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
                {/* Scrollable Chat Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="p-4">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ask {selectedTeacher?.name || 'Your Teacher'}</h3>
                        <p className="text-muted-foreground max-w-sm">
                          Get help understanding any concept from the current topic.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.role === 'teacher' && msg.teacherName && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {msg.teacherName}
                                </p>
                              )}
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t flex-shrink-0">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask ${selectedTeacher?.name || 'your teacher'}...`}
                      disabled={sendingChat}
                    />
                    <Button type="submit" disabled={sendingChat || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] m-4 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <span>Quick Quiz</span>
                <Button variant="ghost" size="sm" onClick={() => setShowQuiz(false)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              <CardContent>
                {generatingQuiz ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : quizQuestions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    Failed to generate quiz. Please try again.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {quizQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="space-y-2">
                        <p className="font-medium">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-1 ml-4">
                          {q.options?.map((opt, oIndex) => {
                            const isSelected = quizAnswers[qIndex] === oIndex;
                            const isCorrect = q.correctIndex === oIndex;
                            const showResult = quizSubmitted;
                            
                            return (
                              <label
                                key={oIndex}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                  showResult
                                    ? isCorrect
                                      ? 'bg-green-500/20'
                                      : isSelected
                                      ? 'bg-red-500/20'
                                      : ''
                                    : isSelected
                                    ? 'bg-primary/20'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${qIndex}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    if (!quizSubmitted) {
                                      setQuizAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
                                    }
                                  }}
                                  disabled={quizSubmitted}
                                  className="accent-primary"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                        {quizSubmitted && q.explanation && (
                          <p className="text-sm text-muted-foreground ml-4 mt-2">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-end gap-2 pt-4">
                      {quizSubmitted ? (
                        <>
                          <p className="text-lg font-medium mr-auto">
                            Score: {Object.keys(quizAnswers).filter(k => 
                              quizAnswers[parseInt(k)] === quizQuestions[parseInt(k)]?.correctIndex
                            ).length}/{quizQuestions.length}
                          </p>
                          <Button variant="outline" onClick={() => setShowQuiz(false)}>
                            Close
                          </Button>
                          <Button onClick={handleStartQuiz}>
                            Try Again
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        >
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>
      )}

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={showApiDialog}
        onOpenChange={setShowApiDialog}
      />
    </div>
  );
};

export default NstStudy;
