const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const Notebook = require('../models/Notebook');
const UserStats = require('../models/UserStats');

// Get user's flashcards
router.get('/:userId', async (req, res) => {
  try {
    const { notebookId, dueOnly } = req.query;
    
    const query = { userId: req.params.userId };
    if (notebookId) query.notebookId = notebookId;
    if (dueOnly === 'true') {
      query.nextReviewDate = { $lte: new Date() };
    }

    const flashcards = await Flashcard.find(query)
      .populate('notebookId', 'title')
      .sort({ nextReviewDate: 1 });

    res.json({ flashcards });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// Get flashcards due for review
router.get('/:userId/due', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const flashcards = await Flashcard.find({
      userId: req.params.userId,
      nextReviewDate: { $lte: new Date() }
    })
      .populate('notebookId', 'title')
      .sort({ nextReviewDate: 1 })
      .limit(parseInt(limit));

    res.json({ flashcards, count: flashcards.length });
  } catch (error) {
    console.error('Error fetching due flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

// Generate flashcards from notebook content
router.post('/generate/:notebookId', async (req, res) => {
  try {
    const { userId, apiKey } = req.body;
    const notebook = await Notebook.findById(req.params.notebookId);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    // Get content to generate flashcards from
    const content = notebook.generatedNotes.socrates || 
                   notebook.generatedNotes.aristotle || 
                   notebook.generatedNotes.plato ||
                   notebook.sources.map(s => s.content).join('\n');

    if (!content) {
      return res.status(400).json({ error: 'No content available to generate flashcards' });
    }

    let flashcards = [];

    if (apiKey) {
      // Use AI to generate flashcards
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Generate 10 diverse flashcards from the following content.
Mix different types of questions to test understanding:
1. Conceptual definitions ("What is...")
2. True/False or Fact checks ("Is it true that...")
3. Application/Scenario ("How would you apply...")
4. Comparisons ("What is the difference between...")
5. Key relationships ("How does X affect Y?")

Format your response as a JSON array with objects containing "front" and "back" properties.
"front": The question
"back": The concise answer

Content:
${content.substring(0, 8000)}

Respond ONLY with the JSON array, no other text.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flashcards = parsed.map(card => ({
          userId,
          notebookId: req.params.notebookId,
          front: card.front,
          back: card.back,
          topic: notebook.category || notebook.title
        }));
      }
    } else {
      // Simple extraction without AI
      const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 30);
      const keyPhrases = sentences.slice(0, 10);
      
      flashcards = keyPhrases.map((phrase, idx) => ({
        userId,
        notebookId: req.params.notebookId,
        front: `Key concept ${idx + 1} from "${notebook.title}":`,
        back: phrase.trim(),
        topic: notebook.category || notebook.title
      }));
    }

    // Save flashcards
    const savedCards = await Flashcard.insertMany(flashcards);

    // Award XP for generating flashcards
    let stats = await UserStats.findOne({ userId });
    if (stats) {
      await stats.addXP(25, 'flashcard_generated', req.params.notebookId);
    }

    res.json({ 
      flashcards: savedCards,
      count: savedCards.length 
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// Review a flashcard
router.put('/:cardId/review', async (req, res) => {
  try {
    const { quality, userId } = req.body; // quality: 0-5 (SM-2)
    
    const flashcard = await Flashcard.findById(req.params.cardId);
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    await flashcard.updateAfterReview(quality);

    // Award XP for studying
    if (userId) {
      let stats = await UserStats.findOne({ userId });
      if (stats) {
        const xp = quality >= 3 ? 10 : 5; // More XP for correct answers
        await stats.addXP(xp, 'flashcard_studied', flashcard.notebookId);
        stats.flashcardsStudied += 1;
        stats.weeklyFlashcards += 1;
        await stats.save();
      }
    }

    res.json({ 
      flashcard,
      nextReview: flashcard.nextReviewDate
    });
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    res.status(500).json({ error: 'Failed to review flashcard' });
  }
});

// Delete a flashcard
router.delete('/:cardId', async (req, res) => {
  try {
    await Flashcard.findByIdAndDelete(req.params.cardId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

// Get flashcard stats for a notebook
router.get('/stats/:notebookId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const flashcards = await Flashcard.find({ 
      notebookId: req.params.notebookId,
      userId 
    });

    const stats = {
      total: flashcards.length,
      due: flashcards.filter(f => new Date(f.nextReviewDate) <= new Date()).length,
      mastered: flashcards.filter(f => f.interval >= 21).length, // 3+ weeks interval
      averageEaseFactor: flashcards.length > 0 
        ? flashcards.reduce((sum, f) => sum + f.easeFactor, 0) / flashcards.length 
        : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching flashcard stats:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard stats' });
  }
});

module.exports = router;
