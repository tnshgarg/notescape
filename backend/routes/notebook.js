const express = require('express');
const router = express.Router();
const Notebook = require('../models/Notebook');

// Get all notebooks for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notebooks = await Notebook.find({ userId })
      .sort({ lastAccessed: -1 })
      .select('-sources.content'); // Exclude large content field from list view
    
    res.json({ success: true, notebooks });
  } catch (err) {
    console.error('Error fetching notebooks:', err);
    res.status(500).json({ error: 'Failed to fetch notebooks', details: err.message });
  }
});

// Get a specific notebook by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    // Update lastAccessed
    notebook.lastAccessed = new Date();
    await notebook.save();
    
    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error fetching notebook:', err);
    res.status(500).json({ error: 'Failed to fetch notebook', details: err.message });
  }
});

// Create a new notebook
router.post('/', async (req, res) => {
  try {
    const { userId, authorName, title, description, sources, category } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required' });
    }

    const notebook = new Notebook({
      userId,
      authorName,
      title,
      description,
      sources: sources || [],
      category,
      lastAccessed: new Date()
    });

    const savedNotebook = await notebook.save();
    res.status(201).json({ success: true, notebook: savedNotebook });
  } catch (err) {
    console.error('Error creating notebook:', err);
    res.status(500).json({ error: 'Failed to create notebook', details: err.message });
  }
});

// Update a notebook
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, category, coverImage } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (category !== undefined) updateData.category = category;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    updateData.lastAccessed = new Date();

    const notebook = await Notebook.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error updating notebook:', err);
    res.status(500).json({ error: 'Failed to update notebook', details: err.message });
  }
});

// Delete a notebook
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notebook = await Notebook.findByIdAndDelete(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    res.json({ success: true, message: 'Notebook deleted successfully' });
  } catch (err) {
    console.error('Error deleting notebook:', err);
    res.status(500).json({ error: 'Failed to delete notebook', details: err.message });
  }
});

// Add a source to a notebook
router.post('/:id/sources', async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, type, content, pdfData, url, size, pageCount } = req.body;
    
    if (!filename || !type) {
      return res.status(400).json({ error: 'filename and type are required' });
    }

    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const newSource = {
      filename,
      type,
      content,
      pdfData, // Store base64 PDF for rendering
      url,
      size,
      pageCount,
      uploadedAt: new Date()
    };

    notebook.sources.push(newSource);
    notebook.lastAccessed = new Date();
    await notebook.save();

    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error adding source:', err);
    res.status(500).json({ error: 'Failed to add source', details: err.message });
  }
});

// Remove a source from a notebook
router.delete('/:id/sources/:sourceId', async (req, res) => {
  try {
    const { id, sourceId } = req.params;
    
    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    notebook.sources = notebook.sources.filter(
      source => source._id.toString() !== sourceId
    );
    
    notebook.lastAccessed = new Date();
    await notebook.save();

    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error removing source:', err);
    res.status(500).json({ error: 'Failed to remove source', details: err.message });
  }
});

// Get all public notebooks (for Marketplace)
router.get('/public/all', async (req, res) => {
  try {
    const { category, search, limit = 20 } = req.query;
    
    let query = { isPublic: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const notebooks = await Notebook.find(query)
      .sort({ likes: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('-sources.content'); // Exclude large content
    
    res.json({ success: true, notebooks });
  } catch (err) {
    console.error('Error fetching public notebooks:', err);
    res.status(500).json({ error: 'Failed to fetch public notebooks', details: err.message });
  }
});

// Like/Unlike a notebook
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const alreadyLiked = notebook.likedBy.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      notebook.likedBy = notebook.likedBy.filter(uid => uid !== userId);
      notebook.likes = Math.max(0, notebook.likes - 1);
    } else {
      // Like
      notebook.likedBy.push(userId);
      notebook.likes += 1;
    }
    
    await notebook.save();

    res.json({ 
      success: true, 
      likes: notebook.likes, 
      liked: !alreadyLiked 
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like', details: err.message });
  }
});

// Save generated notes for a specific mode
router.put('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, content, chapterId } = req.body;
    
    if (!mode || !['socrates', 'aristotle', 'plato'].includes(mode.toLowerCase())) {
      return res.status(400).json({ error: 'Valid mode is required (socrates, aristotle, or plato)' });
    }

    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    if (chapterId) {
      // Find the chapter and update its notes
      let chapterFound = false;
      
      for (const source of notebook.sources) {
        if (source.chapters) {
          const chapter = source.chapters.id(chapterId);
          if (chapter) {
            if (!chapter.generatedNotes) {
              chapter.generatedNotes = { socrates: '', aristotle: '', plato: '' };
            }
            chapter.generatedNotes[mode.toLowerCase()] = content || '';
            chapterFound = true;
            break;
          }
        }
      }
      
      if (!chapterFound) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
    } else {
      // Update the notebook-level generated notes (legacy/fallback)
      notebook.generatedNotes[mode.toLowerCase()] = content || '';
    }

    notebook.lastAccessed = new Date();
    await notebook.save();

    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error saving generated notes:', err);
    res.status(500).json({ error: 'Failed to save generated notes', details: err.message });
  }
});

// Process chapters for a source using AI
router.post('/:id/sources/:sourceId/process-chapters', async (req, res) => {
  try {
    const { id, sourceId } = req.params;
    const { apiKey } = req.body; // Get API key from request for AI analysis
    const { processSourceIntoChapters } = require('../services/chapterProcessor');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const sourceIndex = notebook.sources.findIndex(s => s._id.toString() === sourceId);
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Source not found' });
    }

    const source = notebook.sources[sourceIndex];
    
    if (!source.content || source.content.trim().length === 0) {
      return res.status(400).json({ error: 'Source has no content to process' });
    }

    let chapters;
    
    // Use AI analysis if apiKey is provided, otherwise fallback to rule-based
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze this PDF content and identify logical chapters or sections.

The PDF has ${source.pageCount || 'unknown'} pages. The content includes [Page X] markers to indicate page boundaries.

For each chapter/section you identify, provide:
1. A descriptive title
2. The start page number
3. The end page number  
4. A relevance score from 1-10 (10 = highly relevant educational content, 1 = irrelevant like table of contents, blank pages, references)

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "title": "Chapter title here",
    "startPage": 1,
    "endPage": 5,
    "relevanceScore": 8
  }
]

Rules:
- Identify logical content breaks (chapter headings, major topic changes)
- Exclude or give low relevance to: blank pages, table of contents, index, references, acknowledgments
- Each chapter should be a meaningful unit of content (not too short, not too long)
- If no clear chapters exist, divide by logical topic boundaries

PDF Content:
${source.content.substring(0, 50000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();
        
        // Clean up the response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const aiChapters = JSON.parse(responseText);
        
        // Filter and format chapters
        chapters = aiChapters
          .filter(ch => ch.relevanceScore >= 4)
          .map((ch, index) => {
            // Extract content for this chapter from the source
            const pagePattern = new RegExp(`\\[Page\\s+(${ch.startPage})\\]([\\s\\S]*?)(?=\\[Page\\s+${ch.endPage + 1}\\]|$)`, 'i');
            let chapterContent = '';
            
            // Simple content extraction between page markers
            const contentStart = source.content.indexOf(`[Page ${ch.startPage}]`);
            const contentEnd = ch.endPage < source.pageCount 
              ? source.content.indexOf(`[Page ${ch.endPage + 1}]`)
              : source.content.length;
            
            if (contentStart !== -1) {
              chapterContent = source.content.substring(contentStart, contentEnd !== -1 ? contentEnd : undefined);
            } else {
              // Fallback: use portion of content
              const wordsPerPage = Math.floor(source.content.split(/\s+/).length / (source.pageCount || 1));
              const startWord = (ch.startPage - 1) * wordsPerPage;
              const endWord = ch.endPage * wordsPerPage;
              const words = source.content.split(/\s+/);
              chapterContent = words.slice(startWord, endWord).join(' ');
            }
            
            return {
              title: ch.title || `Section ${index + 1}`,
              startPage: ch.startPage || 1,
              endPage: ch.endPage || ch.startPage || 1,
              content: chapterContent,
              order: index,
              wordCount: chapterContent.split(/\s+/).length,
              generatedNotes: { socrates: '', aristotle: '', plato: '' }
            };
          });
          
        console.log(`AI identified ${aiChapters.length} chapters, ${chapters.length} are relevant`);
      } catch (aiError) {
        console.error('AI chapter analysis failed, falling back to rule-based:', aiError.message);
        chapters = processSourceIntoChapters(source);
      }
    } else {
      // Fallback to rule-based processing
      chapters = processSourceIntoChapters(source);
    }
    
    // Update source with chapters
    notebook.sources[sourceIndex].chapters = chapters;
    notebook.sources[sourceIndex].isChunked = true;
    notebook.lastAccessed = new Date();
    
    await notebook.save();

    res.json({ 
      success: true, 
      chaptersCount: chapters.length,
      chapters: chapters.map(c => ({ title: c.title, wordCount: c.wordCount, order: c.order })),
      notebook 
    });
  } catch (err) {
    console.error('Error processing chapters:', err);
    res.status(500).json({ error: 'Failed to process chapters', details: err.message });
  }
});

// Get public notebook (read-only access)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notebook = await Notebook.findById(id);
    
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    if (!notebook.isPublic) {
      return res.status(403).json({ error: 'This notebook is private' });
    }

    res.json({ success: true, notebook });
  } catch (err) {
    console.error('Error fetching public notebook:', err);
    res.status(500).json({ error: 'Failed to fetch notebook', details: err.message });
  }
});

// Clone a public notebook to user's library
router.post('/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, authorName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sourceNotebook = await Notebook.findById(id);
    
    if (!sourceNotebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    if (!sourceNotebook.isPublic) {
      return res.status(403).json({ error: 'Cannot clone a private notebook' });
    }

    // Create a new notebook with the source's content
    const clonedNotebook = new Notebook({
      userId,
      authorName: authorName || 'Anonymous',
      title: `${sourceNotebook.title} (Copy)`,
      description: sourceNotebook.description,
      sources: sourceNotebook.sources,
      generatedNotes: sourceNotebook.generatedNotes,
      category: sourceNotebook.category,
      isPublic: false, // Cloned notebooks start as private
      lastAccessed: new Date()
    });

    const savedNotebook = await clonedNotebook.save();
    res.status(201).json({ success: true, notebook: savedNotebook });
  } catch (err) {
    console.error('Error cloning notebook:', err);
    res.status(500).json({ error: 'Failed to clone notebook', details: err.message });
  }
});

module.exports = router;

