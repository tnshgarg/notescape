/**
 * NST API Client - Revised
 * API functions for subject folders, notes, teachers, and learning
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ============================================
// TYPES
// ============================================

export interface NstChapter {
  title: string;
  content: string;
  order: number;
}

export interface NstNote {
  _id: string;
  title: string;
  description?: string;
  date: string;
  duration?: string;
  hasAttachment: boolean;
  content?: string;
  chapters: NstChapter[];
  xpValue: number;
  order: number;
  isCompleted: boolean;
}

export interface NstSubject {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  semester?: number;
  icon: string;
  color: string;
  notes: NstNote[];
  teacherPersonas: TeacherPersona[];
  userId?: string;
  isNstOfficial: boolean;
  totalNotes: number;
}

export interface TeacherPersona {
  _id: string;
  name: string;
  title?: string;
  avatar: string;
  style: 'academic' | 'practical' | 'socratic' | 'visual';
  description?: string;
  personality?: string;
  accentColor: string;
  isDefault: boolean;
}

export interface NoteProgress {
  noteId: string;
  started: boolean;
  completed: boolean;
  chaptersCompleted: number[];
  currentChapter: number;
  difficultyUsed: 'easy' | 'medium' | 'advanced';
  xpEarned: number;
  xpMultiplier: number;
  quizAttempts: number;
  bestQuizScore: number;
  timeSpent: number;
}

export interface NstProgress {
  _id: string;
  userId: string;
  subjectId: string;
  totalXp: number;
  completedNotes: number;
  noteProgress: NoteProgress[];
  preferredDifficulty: 'easy' | 'medium' | 'advanced';
  preferredTeacher?: TeacherPersona;
  currentStreak: number;
  longestStreak: number;
}

// ============================================
// SUBJECTS API
// ============================================

export async function fetchSubjects(userId?: string): Promise<NstSubject[]> {
  const url = userId 
    ? `${API_URL}/api/nst/subjects?userId=${userId}`
    : `${API_URL}/api/nst/subjects`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch subjects');
  return data.subjects;
}

export async function fetchSubject(subjectId: string): Promise<NstSubject> {
  const response = await fetch(`${API_URL}/api/nst/subjects/${subjectId}`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch subject');
  return data.subject;
}

export async function createSubject(subjectData: {
  userId: string;
  name: string;
  code?: string;
  description?: string;
  semester?: number;
  icon?: string;
  color?: string;
}): Promise<NstSubject> {
  const response = await fetch(`${API_URL}/api/nst/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subjectData)
  });
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to create subject');
  return data.subject;
}

export async function addNoteToSubject(subjectId: string, noteData: {
  title: string;
  description?: string;
  content: string;
  duration?: string;
  chapters?: NstChapter[];
}): Promise<NstNote> {
  const response = await fetch(`${API_URL}/api/nst/subjects/${subjectId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData)
  });
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to add note');
  return data.note;
}

export async function fetchNote(subjectId: string, noteId: string): Promise<{ note: NstNote; subject: { _id: string; name: string; code?: string } }> {
  const response = await fetch(`${API_URL}/api/nst/subjects/${subjectId}/notes/${noteId}`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch note');
  return { note: data.note, subject: data.subject };
}

// ============================================
// TEACHERS API
// ============================================

export async function fetchTeachers(): Promise<TeacherPersona[]> {
  const response = await fetch(`${API_URL}/api/nst/teachers`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch teachers');
  return data.teachers;
}

export async function fetchTeacher(teacherId: string): Promise<TeacherPersona> {
  const response = await fetch(`${API_URL}/api/nst/teachers/${teacherId}`);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch teacher');
  return data.teacher;
}

// ============================================
// PROGRESS API
// ============================================

export async function fetchProgress(userId: string, subjectId?: string): Promise<NstProgress[]> {
  const url = subjectId 
    ? `${API_URL}/api/nst/progress/${userId}?subjectId=${subjectId}`
    : `${API_URL}/api/nst/progress/${userId}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to fetch progress');
  return data.progress;
}

export type ProgressAction = 'start' | 'complete_chapter' | 'complete_note' | 'complete_quiz' | 'set_teacher' | 'update_time';

export async function updateProgress(
  userId: string,
  subjectId: string,
  noteId: string,
  action: ProgressAction,
  data?: { 
    chapterIndex?: number; 
    difficulty?: string; 
    xpValue?: number; 
    score?: number;
    teacherId?: string;
    seconds?: number;
  }
): Promise<{ totalXp: number; completedNotes: number; currentStreak: number; noteProgress: NoteProgress }> {
  const response = await fetch(`${API_URL}/api/nst/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subjectId, noteId, action, data })
  });
  const result = await response.json();
  
  if (!result.success) throw new Error(result.error || 'Failed to update progress');
  return result.progress;
}

// ============================================
// AI GENERATION API
// ============================================

export type Difficulty = 'easy' | 'medium' | 'advanced';

export async function generateStudyNotes(
  content: string,
  difficulty: Difficulty,
  teacherId: string | null,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${API_URL}/api/nst/generate-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, difficulty, teacherId, apiKey })
  });
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to generate notes');
  return data.notes;
}

export async function chatWithTeacher(
  message: string,
  context: string,
  teacherId: string | null,
  chatHistory: string,
  apiKey: string
): Promise<{ reply: string; teacherName: string }> {
  const response = await fetch(`${API_URL}/api/nst/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, teacherId, chatHistory, apiKey })
  });
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to chat');
  return { reply: data.reply, teacherName: data.teacherName };
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  expectedAnswer?: string;
  keyPoints?: string[];
}

export async function generateQuiz(
  content: string,
  type: 'mcq' | 'short',
  count: number,
  apiKey: string
): Promise<QuizQuestion[]> {
  const response = await fetch(`${API_URL}/api/nst/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, type, count, apiKey })
  });
  const data = await response.json();
  
  if (!data.success) throw new Error(data.error || 'Failed to generate quiz');
  return data.questions;
}

// ============================================
// ACCESS CONTROL
// ============================================

// Production NST email domain
const NST_EMAIL_DOMAINS = ['@nst.rishihood.edu.in'];
// Whitelist for testing (can be expanded)
const NST_WHITELIST_EMAILS: string[] = [];

export function isNstUser(email?: string | null): boolean {
  if (!email) return false;
  
  for (const domain of NST_EMAIL_DOMAINS) {
    if (email.endsWith(domain)) return true;
  }
  
  if (NST_WHITELIST_EMAILS.includes(email)) return true;
  
  // Allow all in development
  if (import.meta.env.DEV) return true;
  
  return false;
}

// ============================================
// UTILITY
// ============================================

// Get completion percentage for a subject
export function getSubjectCompletionPercent(subject: NstSubject, progress?: NstProgress): number {
  if (!progress || subject.totalNotes === 0) return 0;
  return Math.round((progress.completedNotes / subject.totalNotes) * 100);
}

// Get XP multiplier for difficulty
export function getXpMultiplier(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 1.5;
    case 'advanced': return 2;
    default: return 1;
  }
}
