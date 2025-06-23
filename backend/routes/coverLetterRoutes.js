// routes/coverLetterRoutes.js
import express from 'express';
import UserCoverLetter from '../models/UserCoverLetter.js';

const router = express.Router();

// Get all cover letters for a user
router.get('/:userId', async (req, res) => {
  try {
    const coverLetters = await UserCoverLetter.find({ userId: req.params.userId });
    res.json(coverLetters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific cover letter
router.get('/single/:id', async (req, res) => {
  try {
    const coverLetter = await UserCoverLetter.findById(req.params.id);
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found' });
    }
    res.json(coverLetter);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update a cover letter
router.post('/', async (req, res) => {
  try {
    const { id, ...coverLetterData } = req.body;
    
    let coverLetter;
    if (id) {
      coverLetter = await UserCoverLetter.findByIdAndUpdate(
        id,
        { ...coverLetterData, updatedAt: new Date() },
        { new: true }
      );
    } else {
      coverLetter = new UserCoverLetter(coverLetterData);
      await coverLetter.save();
    }
    
    res.json(coverLetter);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a cover letter
router.delete('/:id', async (req, res) => {
  try {
    const coverLetter = await UserCoverLetter.findByIdAndDelete(req.params.id);
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found' });
    }
    res.json({ message: 'Cover letter deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;