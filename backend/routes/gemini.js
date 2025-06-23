import express from 'express';
import { generateResume, generateCoverLetter } from '../controllers/gemini.js';
// import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';


const router = express.Router();

router.post('/resume',  generateResume);
router.post('/coverletter',  generateCoverLetter);

export default router;
