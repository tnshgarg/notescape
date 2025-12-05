/**
 * NST API Routes
 * Handles subjects, notes, teacher personas, progress, and AI generation
 */

const express = require('express');
const router = express.Router();
const NstSubject = require('../models/NstSubject');
const NstTeacherPersona = require('../models/NstTeacherPersona');
const NstProgress = require('../models/NstProgress');

// ============================================
// SUBJECTS
// ============================================

// Get all subjects for a user (includes NST official subjects)
router.get('/subjects', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Get user's own subjects + official NST subjects
    const query = userId 
      ? { $or: [{ userId }, { isNstOfficial: true }] }
      : { isNstOfficial: true };
    
    const subjects = await NstSubject.find(query)
      .populate('teacherPersonas')
      .sort({ isNstOfficial: -1, updatedAt: -1 });
    
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single subject with all notes
router.get('/subjects/:id', async (req, res) => {
  try {
    const subject = await NstSubject.findById(req.params.id)
      .populate('teacherPersonas');
    
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new subject folder
router.post('/subjects', async (req, res) => {
  try {
    const { userId, name, code, description, semester, icon, color } = req.body;
    
    const subject = new NstSubject({
      userId,
      name,
      code,
      description,
      semester,
      icon,
      color
    });
    
    await subject.save();
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add note to subject
router.post('/subjects/:id/notes', async (req, res) => {
  try {
    const { title, description, content, duration, chapters } = req.body;
    
    const subject = await NstSubject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    
    // Auto-generate chapters if not provided
    let noteChapters = chapters;
    if (!chapters && content) {
      noteChapters = autoSplitChapters(content);
    }
    
    subject.notes.push({
      title,
      description,
      content,
      duration,
      chapters: noteChapters || [],
      hasAttachment: !!content,
      order: subject.notes.length
    });
    
    await subject.save();
    res.json({ success: true, subject, note: subject.notes[subject.notes.length - 1] });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single note
router.get('/subjects/:subjectId/notes/:noteId', async (req, res) => {
  try {
    const subject = await NstSubject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    
    const note = subject.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    res.json({ success: true, note, subject: { _id: subject._id, name: subject.name, code: subject.code } });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Auto-split content into chapters based on headings
function autoSplitChapters(content) {
  const chapters = [];
  // Split by markdown headings (# or ##)
  const sections = content.split(/(?=^#{1,2}\s)/m);
  
  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (!trimmed) return;
    
    // Extract title from first line
    const lines = trimmed.split('\n');
    let title = lines[0].replace(/^#+\s*/, '').trim() || `Section ${index + 1}`;
    const sectionContent = lines.slice(1).join('\n').trim() || trimmed;
    
    chapters.push({
      title,
      content: sectionContent,
      order: chapters.length
    });
  });
  
  // If no chapters found, create single chapter
  if (chapters.length === 0) {
    chapters.push({
      title: 'Main Content',
      content: content,
      order: 0
    });
  }
  
  return chapters;
}

// ============================================
// TEACHER PERSONAS
// ============================================

// Get all teacher personas
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await NstTeacherPersona.find({ isActive: true })
      .sort({ isDefault: -1, name: 1 });
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single teacher
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await NstTeacherPersona.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.json({ success: true, teacher });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROGRESS
// ============================================

// Get user progress for subjects
router.get('/progress/:userId', async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    const query = { userId: req.params.userId };
    if (subjectId) query.subjectId = subjectId;
    
    const progress = await NstProgress.find(query)
      .populate('preferredTeacher');
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update progress (start/complete note, quiz, etc.)
router.post('/progress', async (req, res) => {
  try {
    const { userId, subjectId, noteId, action, data } = req.body;
    
    // Find or create progress record
    let progress = await NstProgress.findOne({ userId, subjectId });
    if (!progress) {
      progress = new NstProgress({ userId, subjectId });
    }
    
    // Find note progress
    let noteProgress = progress.noteProgress.find(np => np.noteId.toString() === noteId);
    if (!noteProgress && noteId) {
      progress.noteProgress.push({ noteId });
      noteProgress = progress.noteProgress[progress.noteProgress.length - 1];
    }
    
    // Handle different actions
    switch (action) {
      case 'start':
        if (noteProgress && !noteProgress.started) {
          noteProgress.started = true;
          noteProgress.startedAt = new Date();
        }
        break;
        
      case 'complete_chapter':
        if (noteProgress && data?.chapterIndex !== undefined) {
          if (!noteProgress.chaptersCompleted.includes(data.chapterIndex)) {
            noteProgress.chaptersCompleted.push(data.chapterIndex);
          }
          noteProgress.currentChapter = data.chapterIndex + 1;
        }
        break;
        
      case 'complete_note':
        if (noteProgress && !noteProgress.completed) {
          noteProgress.completed = true;
          noteProgress.completedAt = new Date();
          
          // Calculate XP
          const multiplier = data?.difficulty === 'advanced' ? 2 : 
                            data?.difficulty === 'medium' ? 1.5 : 1;
          noteProgress.xpMultiplier = multiplier;
          noteProgress.xpEarned = Math.round((data?.xpValue || 30) * multiplier);
          noteProgress.difficultyUsed = data?.difficulty || 'medium';
          
          // Update totals
          progress.totalXp += noteProgress.xpEarned;
          progress.completedNotes += 1;
        }
        break;
        
      case 'complete_quiz':
        if (noteProgress) {
          noteProgress.quizAttempts += 1;
          if (data?.score > noteProgress.bestQuizScore) {
            noteProgress.bestQuizScore = data.score;
          }
        }
        break;
        
      case 'set_teacher':
        if (data?.teacherId) {
          progress.preferredTeacher = data.teacherId;
          if (noteProgress) {
            noteProgress.teacherPersonaUsed = data.teacherId;
          }
        }
        break;
        
      case 'update_time':
        if (noteProgress && data?.seconds) {
          noteProgress.timeSpent += data.seconds;
        }
        break;
    }
    
    // Update streak
    const today = new Date().toDateString();
    const lastActive = progress.lastActiveDate?.toDateString();
    
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastActive === yesterday) {
        progress.currentStreak += 1;
      } else if (lastActive !== today) {
        progress.currentStreak = 1;
      }
      progress.lastActiveDate = new Date();
      
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    }
    
    progress.updatedAt = new Date();
    await progress.save();
    
    res.json({ 
      success: true, 
      progress: {
        totalXp: progress.totalXp,
        completedNotes: progress.completedNotes,
        currentStreak: progress.currentStreak,
        noteProgress: noteProgress
      }
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AI GENERATION
// ============================================

// Generate study notes with teacher persona
router.post('/generate-notes', async (req, res) => {
  try {
    const { content, difficulty, teacherId, apiKey } = req.body;
    
    if (!content || !apiKey) {
      return res.status(400).json({ success: false, error: 'Content and API key required' });
    }
    
    // Get teacher persona system prompt
    let teacherPrompt = '';
    if (teacherId) {
      const teacher = await NstTeacherPersona.findById(teacherId);
      if (teacher) {
        teacherPrompt = `\n\nTeaching Style: ${teacher.systemPrompt}`;
      }
    }
    
    // SHORTER, more focused prompts based on difficulty
    const difficultyPrompts = {
      easy: `Create CONCISE beginner notes (max 300 words). Use:
- Simple language, no jargon
- 1-2 real-world analogies
- Bullet points only
- Skip complex details`,
      medium: `Create FOCUSED study notes (max 500 words). Include:
- Clear explanations
- Key formulas/definitions
- 1 example per concept
- Short summary`,
      advanced: `Create COMPREHENSIVE notes (max 700 words). Cover:
- Technical depth
- Edge cases
- Advanced concepts
- Connections to related topics`
    };
    
    const prompt = `You are a concise tutor. ${difficultyPrompts[difficulty] || difficultyPrompts.medium}${teacherPrompt}

Create study notes from this content. BE BRIEF - students want quick, scannable notes.

Content:
${content.slice(0, 3000)}

Format:
## Key Concepts
- Bullet points

## Quick Summary
2-3 sentences max

Keep it SHORT and USEFUL. No fluff.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }
    
    const notes = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat with teacher
router.post('/chat', async (req, res) => {
  try {
    const { message, context, teacherId, chatHistory, apiKey } = req.body;
    
    if (!message || !apiKey) {
      return res.status(400).json({ success: false, error: 'Message and API key required' });
    }
    
    // Get teacher persona
    let systemPrompt = 'You are a helpful tutor. Answer questions clearly and concisely.';
    let teacherName = 'Tutor';
    
    if (teacherId) {
      const teacher = await NstTeacherPersona.findById(teacherId);
      if (teacher) {
        systemPrompt = teacher.systemPrompt;
        teacherName = teacher.name;
      }
    }
    
    // Build conversation
    const messages = [
      { role: 'user', parts: [{ text: `System: ${systemPrompt}\n\nContext from current study material:\n${context || 'No specific context provided.'}\n\nPrevious conversation:\n${chatHistory || 'None'}\n\nStudent's question: ${message}` }] }
    ];
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }
    
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ success: true, reply, teacherName });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate quiz
router.post('/generate-quiz', async (req, res) => {
  try {
    const { content, type, count, apiKey } = req.body;
    
    if (!content || !apiKey) {
      return res.status(400).json({ success: false, error: 'Content and API key required' });
    }
    
    const quizType = type || 'mcq';
    const questionCount = count || 5;
    
    const typePrompts = {
      mcq: `Generate ${questionCount} multiple choice questions. Format as JSON array:
[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]`,
      short: `Generate ${questionCount} short answer questions. Format as JSON array:
[{"question": "...", "expectedAnswer": "...", "keyPoints": ["point1", "point2"]}]`
    };
    
    const prompt = `Based on this content, ${typePrompts[quizType]}

Content:
${content}

Return ONLY valid JSON, no markdown.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }
    
    let questionsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    questionsText = questionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const questions = JSON.parse(questionsText);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
