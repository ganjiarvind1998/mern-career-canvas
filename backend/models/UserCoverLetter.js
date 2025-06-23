// models/UserCoverLetter.js
import mongoose from 'mongoose';

const coverLetterSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk user ID
  applicantName: String,
  applicantEmail: String,
  applicantPhone: String,
  applicantAddress: String,
  hiringManager: String,
  companyName: String,
  jobTitle: String,
  jobSource: String,
  skills: String,
  achievements: String,
  generatedLetter: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserCoverLetter', coverLetterSchema);