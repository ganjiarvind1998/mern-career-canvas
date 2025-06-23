// models/UserResume.js
import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  jobTitle: String,
  company: String,
  duration: String,
  description: String
});

const educationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  year: String
});

const resumeSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk user ID
  fullName: String,
  email: String,
  phone: String,
  address: String,
  summary: String,
  experiences: [experienceSchema],
  education: [educationSchema],
  skills: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserResume', resumeSchema);