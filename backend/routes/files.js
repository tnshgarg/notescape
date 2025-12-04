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
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

let gridfsBucket;

// Initialize GridFS Bucket when connection is open
mongoose.connection.on('connected', () => {
  const db = mongoose.connections[0].db;
  gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'uploads'
  });
  console.log('GridFS Bucket initialized');
});

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

// Upload PDF to GridFS and extract text
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // 1. Upload to GridFS
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype
    });

    const fileId = uploadStream.id;

    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // 2. Extract Text (Keep existing logic)
    const pdfBuffer = req.file.buffer;
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
            return `[Page ${pageData.pageNumber}]\n${text}\n`;
          });
      }
    }

    const data = await pdf(pdfBuffer, options);
    
    let text = data.text;
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    res.json({
      success: true,
      fileId: fileId,
      text,
      pageCount: data.numpages,
      info: data.info
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

// Stream file from GridFS
router.get('/:id', async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: 'Storage not initialized' });
    }

    const _id = new mongoose.Types.ObjectId(req.params.id);
    const files = await gridfsBucket.find({ _id }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType);
    res.set('Content-Length', file.length);

    const downloadStream = gridfsBucket.openDownloadStream(_id);
    downloadStream.pipe(res);

  } catch (error) {
    console.error('File stream error:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

// Legacy extract-pdf route (kept for reference, but /upload is preferred)
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
