/**
 * Chapter Processor Service
 * Extracts logical chapters/sections from source content for paginated context
 */

const MAX_CHAPTER_WORDS = 2000; // Maximum words per chapter
const MIN_CHAPTER_WORDS = 100; // Minimum words for a standalone chapter

/**
 * Detect chapter/section boundaries in text content
 * @param {string} content - The full text content
 * @returns {Array} Array of detected sections with title and content
 */
function detectSections(content) {
  const sections = [];
  
  // Common chapter/section patterns
  const patterns = [
    // Explicit chapter markers
    /^(Chapter\s+\d+[.:]\s*.+)$/gim,
    /^(CHAPTER\s+\d+[.:]\s*.+)$/gim,
    // Section headers (numbered)
    /^(\d+\.\s+.+)$/gm,
    /^(\d+\.\d+\s+.+)$/gm,
    // Markdown headers
    /^(#{1,3}\s+.+)$/gm,
    // All caps headers
    /^([A-Z][A-Z\s]{10,})$/gm,
  ];

  // Split content by lines
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let isHeader = false;
    let headerTitle = '';

    // Check if line matches any header pattern
    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(line);
      if (match) {
        isHeader = true;
        headerTitle = match[1].replace(/^#+\s*/, '').trim();
        break;
      }
    }

    if (isHeader && currentContent.length > 0) {
      // Save previous section
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = headerTitle;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget the last section
  if (currentContent.length > 0) {
    sections.push({
      title: currentSection || 'Introduction',
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

/**
 * Split large sections into smaller chunks
 * @param {Array} sections - Detected sections
 * @returns {Array} Chunked sections with proper sizing
 */
function chunkSections(sections) {
  const chunks = [];

  for (const section of sections) {
    const words = section.content.split(/\s+/);
    
    if (words.length <= MAX_CHAPTER_WORDS) {
      chunks.push(section);
    } else {
      // Split into multiple parts
      let partNum = 1;
      for (let i = 0; i < words.length; i += MAX_CHAPTER_WORDS) {
        const chunkWords = words.slice(i, i + MAX_CHAPTER_WORDS);
        chunks.push({
          title: `${section.title} (Part ${partNum})`,
          content: chunkWords.join(' ')
        });
        partNum++;
      }
    }
  }

  return chunks;
}

/**
 * Process PDF content that has page markers
 * @param {string} content - Content with page markers like [Page 1], [Page 2]
 * @returns {Array} Sections with page numbers
 */
function processPdfWithPages(content) {
  const pagePattern = /\[Page\s+(\d+)\]/gi;
  const sections = [];
  let currentPage = 1;
  let lastSplitIndex = 0;
  
  const matches = [...content.matchAll(pagePattern)];
  
  if (matches.length === 0) {
    // No page markers, fall back to regular section detection
    return null;
  }

  // Process by page groups (every 5-10 pages)
  const PAGES_PER_SECTION = 5;
  let sectionStartPage = 1;
  let sectionContent = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const pageNum = parseInt(match[1]);
    const nextMatch = matches[i + 1];
    
    const pageContent = content.slice(
      match.index + match[0].length,
      nextMatch ? nextMatch.index : undefined
    ).trim();

    sectionContent.push(pageContent);

    if ((pageNum - sectionStartPage + 1) >= PAGES_PER_SECTION || i === matches.length - 1) {
      sections.push({
        title: `Pages ${sectionStartPage}-${pageNum}`,
        content: sectionContent.join('\n\n'),
        startPage: sectionStartPage,
        endPage: pageNum
      });
      sectionStartPage = pageNum + 1;
      sectionContent = [];
    }
  }

  return sections;
}

/**
 * Main function to process source content into chapters
 * @param {Object} source - Source object with content, type, etc.
 * @returns {Array} Processed chapters ready to be saved
 */
function processSourceIntoChapters(source) {
  if (!source.content || source.content.trim().length === 0) {
    return [];
  }

  let sections = [];

  // Try PDF page-based processing first
  if (source.type === 'pdf') {
    sections = processPdfWithPages(source.content);
  }

  // Fall back to section detection
  if (!sections || sections.length === 0) {
    sections = detectSections(source.content);
  }

  // Chunk any sections that are too large
  sections = chunkSections(sections);

  // Filter out tiny sections
  sections = sections.filter(s => 
    s.content.split(/\s+/).length >= MIN_CHAPTER_WORDS
  );

  // If no sections detected or just one tiny section, create chunks by word count
  if (sections.length === 0) {
    const words = source.content.split(/\s+/);
    let chapterNum = 1;
    for (let i = 0; i < words.length; i += MAX_CHAPTER_WORDS) {
      const chunkWords = words.slice(i, i + MAX_CHAPTER_WORDS);
      sections.push({
        title: `Section ${chapterNum}`,
        content: chunkWords.join(' ')
      });
      chapterNum++;
    }
  }

  // Convert to chapter schema format
  return sections.map((section, index) => ({
    title: section.title,
    content: section.content,
    startPage: section.startPage,
    endPage: section.endPage,
    order: index,
    wordCount: section.content.split(/\s+/).length
  }));
}

/**
 * Calculate word count for content
 */
function getWordCount(content) {
  return content ? content.split(/\s+/).length : 0;
}

module.exports = {
  processSourceIntoChapters,
  detectSections,
  chunkSections,
  getWordCount,
  MAX_CHAPTER_WORDS,
  MIN_CHAPTER_WORDS
};
