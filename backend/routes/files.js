const express = require('express');
const router = express.Router();
const multer = require('multer');

// Polyfill DOMMatrix for pdf-parse (fixes ReferenceError: DOMMatrix is not defined)
if (!global.DOMMatrix) {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

const pdf = require('pdf-parse');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Extract text from PDF
router.post('/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfBuffer = req.file.buffer;
    
    // Custom render function to inject page markers
    const options = {
      pagerender: function(pageData) {
        const render_options = {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        }
    
        return pageData.getTextContent(render_options)
          .then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY){
                text += item.str;
              }  
              else{
                text += '\n' + item.str;
              }                                                    
              lastY = item.transform[5];
            }
            // Inject page marker at the start of each page
            return `[Page ${pageData.pageNumber}]\n${text}\n`;
          });
      }
    }

    // Parse PDF and extract text using pdf-parse v1.1.1
    const data = await pdf(pdfBuffer, options);
    
    // Clean up the extracted text
    let text = data.text;
    
    // Remove excessive whitespace while preserving paragraph structure and page markers
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Convert PDF buffer to base64 for frontend rendering
    const pdfBase64 = pdfBuffer.toString('base64');

    res.json({
      success: true,
      text,
      pdfData: `data:application/pdf;base64,${pdfBase64}`,
      pageCount: data.numpages,
      info: data.info
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract text from PDF',
      details: error.message 
    });
  }
});

module.exports = router;
