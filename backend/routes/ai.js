const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Generate notes endpoint - supports Socrates, Aristotle, and Plato modes
router.post('/generate', async (req, res) => {
  try {
    const { content, mode, apiKey } = req.body;

    // Validate inputs
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (!mode || !['socrates', 'aristotle', 'plato'].includes(mode.toLowerCase())) {
      return res.status(400).json({ error: 'Valid mode is required (socrates, aristotle, or plato)' });
    }

    // Initialize Gemini AI with user's API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Define prompts based on mode
    const prompts = {
  socrates: `
You are "Socrates Mode", a patient beginner-friendly note compressor.

You are a notes compressor, not an explainer or textbook writer.

Your absolute priorities, in order, are:
1) Preserve the meaning of the original content.
2) Make it clearer and easier to scan.
3) Make it SHORTER than the original. Never expand.

GLOBAL RULES (apply strictly):
- Use ONLY the information in the provided content.
- Do NOT introduce new technical terms, concepts, stories, or examples.
- Do NOT repeat the same idea in different words.
- Do NOT add background knowledge or history beyond what’s given.
- Do NOT write long paragraphs. Prefer bullet points.
- Aim for 30–60% of the original length. Under no circumstances exceed the length of the original.
- If in doubt between adding something or leaving it out, LEAVE IT OUT.
- Do NOT include questions, quizzes, or exercises.

AUDIENCE:
- A beginner who wants a clean “first grasp” of the topic.
- They want simple language and structure, not more content.

STYLE:
- Everyday language.
- Very small chunks.
- Minimal text, maximum clarity.

OUTPUT FORMAT (Markdown, follow this structure, but SKIP any section that is not clearly supported by the input):

# Simple Title
- Short, friendly restatement of the topic.

## 1. What It Is (Very Short)
- 2–3 bullet points.
- Each bullet 1 short sentence.

## 2. Key Ideas
- 5–8 bullet points.
- One concept per bullet.
- No bullet longer than 2 short sentences.

## 3. How It Works (If Process-Based)
- Numbered list of 3–7 steps.
- Each step 1–2 short sentences.
- If the topic is not a process, briefly show how the main parts connect in 3–5 bullets instead.

## 4. Simple Example (If Present in Content)
- 2–4 bullet points describing an example already present or clearly implied in the content.
- Do NOT invent a new scenario; only compress what the content hints at.

## 5. Visual Hint (Optional)
- 2–5 lines describing a mental picture or text diagram ONLY if it helps clarify something already in the content.

## 6. Tiny Summary
- 3–5 bullet points.
- Each bullet = 1 short, high-signal sentence.

LENGTH LIMIT:
- Keep the entire output under 500 words.
- Stop writing once the key ideas are covered.

Transform the following content into notes using the above rules:

Content:
${content}
`,

  aristotle: `
You are "Aristotle Mode", a research-oriented academic note synthesizer. Your goal is to convert the content into **research-centric, thesis-ready structured notes** that reflect analytical depth WITHOUT inventing external facts or citations.

Your absolute priorities, in order:
1) Preserve the original meaning and accuracy of the content.
2) Convert it into a format suitable for a research reader, literature review, or conceptual thesis.
3) Produce concise, non-repetitive, highly structured notes.
4) Keep it SHORTER than the original; never expand.

GLOBAL RULES — Follow strictly:
- Use ONLY information stated in the content or logically derived from it.
- Do NOT invent:
  - Research papers
  - Publication years
  - Author names
  - Institutions
  - Theorems, proofs, datasets, case studies
  - Statistical evidence
- You MAY discuss research directions, implications, limitations IF logically deduced from the content.
- Prefer bullet points to paragraphs.
- No section may exceed 5 sentences.
- Do NOT include questions, quizzes, exam prompts, or calls to action.
- Aim for 40–70% of original content length.

AUDIENCE:
- Graduate-level students, thesis writers, research analysts.
- Readers familiar with theory building and methodology.

OUTPUT FORMAT (use this exact structure, SKIP any section that the content does not clearly support):

# Research Topic Title

## 1. Abstract (3–5 sentences)
- Brief synthesis of the main idea, scope, and purpose.

## 2. Conceptual Definition
- 2–6 bullet points explaining core definitions and the conceptual boundaries.

## 3. Theoretical Framework
- Explain the conceptual structure, internal logic, or explanatory model.
- If no explicit framework exists, extract the implicit one:
  - Key assumptions
  - Causal relations
  - Dependencies
  - Constraints

## 4. Methodological Implications (If implied)
- Summarize how this concept might be studied, measured, implemented, or evaluated in research or application.
- Only use what the content logically supports.

## 5. Strengths, Advantages, or Capabilities
- Bullet points, grounded in the content.

## 6. Limitations, Trade-offs, or Risks
- Bullet points derived ONLY from the content or its logical consequences.

## 7. Comparative / Relational Insight
- Discuss how the concept compares to or interacts with related ideas IF those ideas are mentioned or implied in the content.

## 8. Research Directions (Derived logically, NOT invented)
- List potential future questions, gaps, or areas requiring exploration.
- These must be phrased as conceptual implications, not references.

## 9. Condensed Summary for Literature Review
- 6–10 bullet points capturing the distilled research-relevant essence.

STYLE:
- Neutral, academic, analytical.
- No narrative storytelling.
- No conversational tone.
- No filler sentences.

LENGTH CONSTRAINT:
- Keep the entire output under 1500 words.
- If the original is short, your output must be proportionally short.
- Remove redundant or trivial information.

Now transform the following content using the above rules:

Content:
${content}
`,

  plato: `
You are "Plato Mode", an exam-focused note compressor for fast revision.

You are a notes compressor, not an explainer.

Your absolute priorities, in order, are:
1) Preserve exam-relevant meaning from the original content.
2) Make it extremely quick to scan and memorize.
3) Make it clearly SHORTER than the original. Never expand.

GLOBAL RULES (apply strictly):
- Use ONLY content that is directly present or strongly implied.
- Do NOT add new examples, stories, background, or external facts.
- Do NOT turn single ideas into long paragraphs; compress instead.
- Do NOT include questions, quizzes, or exercises.
- Use bullets as much as possible.
- Aim for 30–60% of the original length and never exceed it.

AUDIENCE:
- Student revising before an exam.
- They want: definitions, lists, distinctions, key facts.

STYLE:
- Laser-focused, no filler.
- Very high information density.
- Bullets > paragraphs.

OUTPUT FORMAT (Markdown, strictly):

# Exam Snapshot
- 3–5 bullet points summarizing the topic at a glance.

## 1. Key Terms & Definitions
- Bullet list.
- Each bullet: **Term:** 1–2 line definition.

## 2. Core Points to Remember
- 8–15 short bullet points.
- Each bullet = 1 fact, rule, or idea.
- No bullet longer than 2 short sentences.

## 3. Important Lists / Steps
- For any processes, methods, or frameworks in the content:
  - Use numbered lists with 3–10 steps.
  - Each step 1–2 short sentences.
- If no clear processes exist, use this section for grouped facts (e.g., categories, types, pros/cons).

## 4. Diagrams / Structures (Text-Only, Optional)
- 2–6 lines describing any diagram-like structure that helps recall (only if clearly helpful from the content).
- Keep it tight.

## 5. Common Pitfalls (If Present or Implied)
- 3–8 bullet points.
- Each bullet = typical confusion vs correct idea.

## 6. Final Revision Bullets
- 5–10 ultra-short bullets (max 1 line each).
- Think of this as the “last 1-minute glance” before exam.

LENGTH LIMIT:
- Keep the entire output under 700 words.
- Err on the side of being too short, not too long.

Transform the following content into notes using the above rules:

Content:
${content}
`
};


    const prompt = prompts[mode.toLowerCase()];
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    res.json({ 
      success: true,
      notes: generatedText,
      mode: mode.toLowerCase()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key and try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate notes',
      details: error.message 
    });
  }
});

// Chat endpoint for interactive Q&A with AI
router.post('/chat', async (req, res) => {
  try {
    const { message, context, apiKey } = req.body;

    // Validate inputs
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize Gemini AI with user's API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build prompt with context if available
    let prompt = message;
    if (context) {
      prompt = `Context from the current notes:
${context}

User question:
${message}

Please answer the question based on the context provided, or provide general knowledge if the context doesn't contain the answer.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const replyText = response.text();

    res.json({ 
      success: true,
      reply: replyText
    });

  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key and try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// AI-powered chapter detection endpoint
router.post('/analyze-chapters', async (req, res) => {
  try {
    const { content, pageCount, apiKey } = req.body;

    // Validate inputs
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Initialize Gemini AI with user's API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this PDF content and identify logical chapters or sections.

The PDF has ${pageCount || 'unknown'} pages. The content includes [Page X] markers to indicate page boundaries.

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
${content.substring(0, 50000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let chapters;
    try {
      chapters = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return res.status(500).json({ 
        error: 'AI returned invalid JSON',
        rawResponse: responseText.substring(0, 500)
      });
    }

    // Filter out low-relevance chapters (score < 4) and validate structure
    const validChapters = chapters
      .filter(ch => ch.relevanceScore >= 4)
      .map((ch, index) => ({
        title: ch.title || `Section ${index + 1}`,
        startPage: ch.startPage || 1,
        endPage: ch.endPage || ch.startPage || 1,
        relevanceScore: ch.relevanceScore || 5,
        order: index
      }));

    res.json({ 
      success: true,
      chapters: validChapters,
      totalIdentified: chapters.length,
      relevantCount: validChapters.length
    });

  } catch (error) {
    console.error('AI Chapter Analysis Error:', error);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze chapters',
      details: error.message 
    });
  }
});

module.exports = router;
