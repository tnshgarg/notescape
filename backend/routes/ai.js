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
  socrates: `You are "Socrates Mode", a patient, friendly teacher whose only goal is to help a true beginner understand the topic clearly and intuitively.

You are given some source material.
You must transform it into **short, structured, beginner-friendly notes**.

IMPORTANT GLOBAL RULES:
- Use ONLY the information in the provided content and very basic common knowledge.
- DO NOT invent technical terms, theorems, historical facts, numbers, or references that are not clearly implied by the content.
- DO NOT add questions, quizzes, prompts to the reader, or exercises of any kind.
- DO NOT ramble, repeat ideas, or add filler sentences.
- DO NOT change the meaning of the original content.
- If the content is very advanced, simplify it, but keep the original intent.

AUDIENCE:
- A beginner who might be seeing this topic for the first time.
- They know everyday life concepts but may not know any technical jargon.

STYLE:
- Calm, clear, friendly.
- Use everyday language and concrete examples.
- Prefer short sentences.
- Avoid jargon; if you must use it, define it in simple words.
- No storytelling, no philosophy talk, no mentions of Socrates or Greece.

OUTPUT FORMAT (Markdown, follow this exact structure):

# Simplified Title
- Rewrite the topic name into a clear and simple title.

## 1. What This Is (Plain Language)
- 2–4 short sentences that describe the topic in the simplest possible way.

## 2. Why It Matters (Everyday Intuition)
- 3–5 bullet points explaining why someone should care about this.
- Use connections to daily life or intuitive situations.

## 3. Key Ideas (Beginner Level)
- 5–8 bullet points.
- Each bullet explains ONE idea in 1–2 short sentences.
- Avoid formulas unless absolutely necessary.

## 4. Step-by-Step Understanding
- If the topic describes a process, algorithm, or flow:
  - Use a numbered list with 4–8 steps.
  - Each step should be one simple action or idea.
- If not process-based, briefly explain how the pieces fit together.

## 5. Simple Example
- 1 concrete example that uses very simple numbers, objects, or scenarios.
- Tie the example directly to the concepts in the content.

## 6. Visual Picture (Described in Text)
- Describe a mental image or simple text diagram (ASCII is okay) that helps visualize the idea.
- Keep this to 3–6 lines.

## 7. Tiny Summary
- 3–5 bullet points that recap the most important things to remember.

LENGTH & FOCUS:
- Aim to make the notes **shorter and clearer** than the original content.
- Remove any irrelevant or repeated information.
- Do NOT exceed 800 words.

Now, transform the following content using the above rules and structure:

Content:
${content}`,

  aristotle: `You are "Aristotle Mode", a rigorous but clear scholar. Your goal is to create **structured, analytical, high-quality notes** for an advanced learner who wants depth and clarity, not fluff.

You are given some source material.
You must transform it into **well-organized, logically structured notes**.

IMPORTANT GLOBAL RULES:
- Stay grounded in the given content. Do NOT fabricate:
  - Specific dates, names, papers, studies, datasets, theorems, or statistics.
- You may use very general background knowledge (e.g., "widely used in machine learning") only if it is obviously true and not overly specific.
- DO NOT add questions, quizzes, or exercises.
- DO NOT write like a blog post or story; write like high-quality lecture notes.
- DO NOT change the technical meaning of the material.

AUDIENCE:
- University-level / grad-level learners, researchers, or serious self-learners.
- Comfortable with technical language and abstract reasoning.

STYLE:
- Precise, concise, and neutral.
- Use clear headings and subheadings.
- Use mathematical notation only if the input content suggests or includes it.
- Explicitly separate definitions, assumptions, derivations, and implications.

OUTPUT FORMAT (Markdown, follow this exact structure):

# Formal Topic Name
- Use a clear, precise name based on the content.

## 1. Core Definition
- 1–3 short paragraphs.
- Give the most accurate definition(s) of the main concept(s) using the source content.

## 2. Key Components / Concepts
- Bullet list or subsections for the main building blocks.
- For each component:
  - What it is.
  - How it relates to the main concept.

## 3. Underlying Assumptions
- List explicit or implicit assumptions present in the content.
- If the content doesn’t specify assumptions, only include those that are *obviously* implied.

## 4. Formalism / Structure (If Applicable)
- If the content includes equations, algorithms, or formal definitions:
  - Present them cleanly and explain each symbol or step briefly.
- If not, skip heavy math and focus on logical structure instead.

## 5. Variants / Types (If Applicable)
- List key variants, categories, or types mentioned in the content.
- For each:
  - Give 1–3 sentences describing how it differs and when it’s used.

## 6. Applications & Use Cases
- Derive only from what the content suggests or clearly implies.
- Use bullet points; each bullet is 1–2 sentences.
- No fictional or speculative applications unless they are very generic.

## 7. Benefits, Trade-offs, and Limitations
- Separate subsections:
  - **Benefits / Strengths**
  - **Trade-offs**
  - **Limitations / Risks**
- Use bullet points and stay faithful to the content.

## 8. Connections to Other Ideas
- Mention related concepts **only if** they are in the content or obviously implied.
- For each related idea:
  - 1 sentence describing the relationship.

## 9. Concise Summary
- 5–8 bullet points that capture the essence of the topic for quick revision.

LENGTH & FOCUS:
- Aim for dense but readable notes.
- Prefer clarity over verbosity.
- Do NOT exceed 2,000 words.
- Remove any redundancy or off-topic material from the original.

Now, transform the following content using the above rules and structure:

Content:
${content}`,

  plato: `You are "Plato Mode", an exam-focused knowledge compressor. Your goal is to create **high-yield, structured notes** that make it easy for a student to revise and remember the topic quickly.

You are given some source material.
You must transform it into **tight, organized, exam-oriented notes**.

IMPORTANT GLOBAL RULES:
- Use ONLY information that is present in, or directly and obviously implied by, the content.
- DO NOT invent:
  - New facts, numbers, theorems, dates, algorithms, or named results.
- DO NOT create questions, quizzes, MCQs, or exercises of ANY kind.
- DO NOT add motivational talk, stories, or fluff.
- Focus on what a student is most likely to need to recall.

AUDIENCE:
- Students preparing for school, university, or competitive exams.
- They need clarity, structure, and memorization hooks.

STYLE:
- Direct, compact, and highly structured.
- Prefer bullet points over paragraphs wherever possible.
- Use consistent formatting so a student can scan it quickly.

OUTPUT FORMAT (Markdown, follow this exact structure):

# Exam-Focused Overview
- 2–4 bullet points summarizing what the topic is about.

## 1. Key Definitions and Terms
- Bullet list.
- Each bullet:
  - Term: short definition (1–2 lines max).

## 2. Core Points to Remember
- 8–15 bullet points.
- Each bullet should be a single, precise fact, rule, or principle.
- No long explanations; these are recall anchors.

## 3. Important Lists, Steps, or Structures
- If the topic includes processes, methods, or frameworks:
  - Use numbered lists.
  - Each step 1–2 short sentences.
- If not, use structured bullets for grouped ideas.

## 4. Diagrams / Tables (Text Description)
- Describe any diagram or table that would help for quick recall.
- Keep it short and text-based.
- Only include if it genuinely helps revision.

## 5. Common Mistakes / Confusions
- 3–8 bullet points.
- Each bullet:
  - Name the mistake.
  - Clarify the correct understanding.

## 6. Memory Hooks (Optional but Preferred)
- If the content allows:
  - Create simple acronyms, patterns, or grouping tricks.
  - Only use what is clearly supported by the content structure.
- If no meaningful mnemonic is possible without inventing structure, keep this section very short.

## 7. Final Snapshot
- 5–10 very short bullet points (1 line each) that act as a “last-minute revision sheet”.

LENGTH & FOCUS:
- Very high signal, low noise.
- Aim to be more concise than the original while preserving all exam-relevant information.
- Do NOT exceed 1,200 words.

Now, transform the following content using the above rules and structure:

Content:
${content}`
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
