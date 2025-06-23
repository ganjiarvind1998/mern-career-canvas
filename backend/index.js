
dotenv.config(); 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import openaiRoutes from './routes/gemini.js';
import resumeRoutes from './routes/resumeRoutes.js';
import coverLetterRoutes from './routes/coverLetterRoutes.js';
import geminiRoutes from './routes/gemini.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
// app.use('/api/openai', openaiRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/coverletters', coverLetterRoutes);
app.use('/api/gemini', geminiRoutes); 
// Connect to DB and start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
  });