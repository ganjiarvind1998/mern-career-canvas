// routes/resumeRoutes.js
import express from 'express';
import UserResume from '../models/UserResume.js';

const router = express.Router();

// Get all resumes for a user
router.get('/:userId', async (req, res) => {
  try {
    const resumes = await UserResume.find({ userId: req.params.userId });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific resume
router.get('/single/:id', async (req, res) => {
  try {
    const resume = await UserResume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update a resume
router.post('/', async (req, res) => {
  try {
    const { id, ...resumeData } = req.body;
    
    let resume;
    if (id) {
      resume = await UserResume.findByIdAndUpdate(
        id,
        { ...resumeData, updatedAt: new Date() },
        { new: true }
      );
    } else {
      resume = new UserResume(resumeData);
      await resume.save();
    }
    
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a resume
router.delete('/:id', async (req, res) => {
  try {
    const resume = await UserResume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;