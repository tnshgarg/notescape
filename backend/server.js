const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['https://notescape-jade.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Routes
const aiRoutes = require('./routes/ai');
const notebookRoutes = require('./routes/notebook');
const filesRoutes = require('./routes/files');
const statsRoutes = require('./routes/stats');
const flashcardsRoutes = require('./routes/flashcards');
const nstRoutes = require('./routes/nst');
const usersRoutes = require('./routes/users');

app.use('/api/ai', aiRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/nst', nstRoutes);
app.use('/api/users', usersRoutes);

// Routes Placeholder
app.get('/', (req, res) => {
  res.send('NoteScape API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
