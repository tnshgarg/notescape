const express = require('express');
const router = express.Router();
const UserStats = require('../models/UserStats');

// Get user stats
router.get('/:userId', async (req, res) => {
  try {
    let stats = await UserStats.findOne({ userId: req.params.userId });
    
    if (!stats) {
      // Create new stats for user
      stats = new UserStats({ userId: req.params.userId });
      await stats.save();
    }

    // Check if we need to reset weekly stats
    const weekStart = getWeekStart();
    if (!stats.weekStartDate || stats.weekStartDate < weekStart) {
      stats.weeklyTopics = 0;
      stats.weeklyFlashcards = 0;
      stats.weeklyXP = 0;
      stats.weekStartDate = weekStart;
      await stats.save();
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Log activity and award XP
router.post('/:userId/activity', async (req, res) => {
  try {
    const { type, notebookId, xpAmount } = req.body;
    
    let stats = await UserStats.findOne({ userId: req.params.userId });
    
    if (!stats) {
      stats = new UserStats({ userId: req.params.userId });
    }

    // Define XP rewards
    const xpRewards = {
      notebook_created: 50,
      notes_generated: 100,
      flashcard_studied: 5,
      source_added: 25
    };

    const xp = xpAmount || xpRewards[type] || 10;
    await stats.addXP(xp, type, notebookId);

    // Update type-specific counters
    if (type === 'notes_generated') {
      stats.topicsLearned += 1;
      stats.weeklyTopics += 1;
    } else if (type === 'flashcard_studied') {
      stats.flashcardsStudied += 1;
      stats.weeklyFlashcards += 1;
    }

    await stats.save();

    res.json({ 
      stats,
      xpEarned: xp,
      newLevel: stats.level
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get activity calendar data
router.get('/:userId/activity-calendar', async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const stats = await UserStats.findOne({ userId: req.params.userId });
    
    if (!stats) {
      return res.json({ activityData: [] });
    }

    // Get activity from the last N weeks
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const activityByDate = {};
    stats.activityHistory
      .filter(a => new Date(a.date) >= startDate)
      .forEach(activity => {
        const dateStr = new Date(activity.date).toISOString().split('T')[0];
        if (!activityByDate[dateStr]) {
          activityByDate[dateStr] = 0;
        }
        activityByDate[dateStr] += 1;
      });

    const activityData = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count
    }));

    res.json({ activityData });
  } catch (error) {
    console.error('Error fetching activity calendar:', error);
    res.status(500).json({ error: 'Failed to fetch activity calendar' });
  }
});

// Get knowledge graph data (topics and connections)
router.get('/:userId/knowledge-graph', async (req, res) => {
  try {
    const Notebook = require('../models/Notebook');
    const notebooks = await Notebook.find({ userId: req.params.userId });

    // Build knowledge graph from notebooks
    const nodes = [];
    const edges = [];
    const topicMap = new Map();

    notebooks.forEach(notebook => {
      // Add notebook as a node
      const notebookNode = {
        id: notebook._id.toString(),
        label: notebook.title,
        type: 'notebook',
        hasNotes: !!(notebook.generatedNotes.socrates || notebook.generatedNotes.aristotle || notebook.generatedNotes.plato)
      };
      nodes.push(notebookNode);

      // Extract topics from category
      if (notebook.category) {
        if (!topicMap.has(notebook.category)) {
          const topicNode = {
            id: `topic-${notebook.category}`,
            label: notebook.category,
            type: 'topic'
          };
          nodes.push(topicNode);
          topicMap.set(notebook.category, topicNode.id);
        }
        
        edges.push({
          source: topicMap.get(notebook.category),
          target: notebook._id.toString(),
          type: 'contains'
        });
      }
    });

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge graph' });
  }
});

// Helper function to get start of current week (Monday)
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

module.exports = router;
