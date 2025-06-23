import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function Resume() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    experiences: [{ id: 1, jobTitle: "", company: "", duration: "", description: "" }],
    education: [{ id: 1, degree: "", institution: "", year: "" }],
    skills: [],
  });

  const [generatedResume, setGeneratedResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [skillInput, setSkillInput] = useState("");
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const navigate = useNavigate();

  // Load user's saved resumes
  useEffect(() => {
    if (user) {
      const fetchResumes = async () => {
        try {
          const response = await axios.get(`https://mern-career-canvas-2.onrender.com/api/resumes/${user.id}`);
          setSavedResumes(response.data);
          if (response.data.length > 0) {
            setSelectedResume(response.data[0]._id);
            setFormData(response.data[0]);
            setGeneratedResume(response.data[0].generatedResume || "");
          }
        } catch (error) {
          console.error('Error fetching resumes:', error);
          showToast('error', 'Failed to load saved resumes');
        }
      };
      fetchResumes();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (arrayName, index, e) => {
    const newArray = [...formData[arrayName]];
    newArray[index][e.target.name] = e.target.value;
    setFormData({ ...formData, [arrayName]: newArray });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        { id: Date.now(), jobTitle: "", company: "", duration: "", description: "" }
      ]
    });
  };

  const removeExperience = (id) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter(exp => exp.id !== id)
    });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { id: Date.now(), degree: "", institution: "", year: "" }
      ]
    });
  };

  const removeEducation = (id) => {
    setFormData({
      ...formData,
      education: formData.education.filter(edu => edu.id !== id)
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const saveResume = async () => {
    try {
      let response;
      if (selectedResume) {
        // Update existing resume
        response = await axios.put(`https://mern-career-canvas-2.onrender.com/api/resumes/${selectedResume}`, {
          ...formData,
          userId: user.id,
          generatedResume
        });
      } else {
        // Create new resume
        response = await axios.post(`https://mern-career-canvas-2.onrender.com/api/resumes`, {
          ...formData,
          userId: user.id,
          generatedResume
        });
        setSelectedResume(response.data._id);
      }

      // Update the saved resumes list
      const updatedResumes = await axios.get(`https://mern-career-canvas-2.onrender.com/api/resumes/${user.id}`);
      setSavedResumes(updatedResumes.data);

      showToast('success', 'Resume saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      showToast('error', 'Failed to save resume');
    }
  };

  const generateResume = async () => {
    setLoading(true);
    try {
      if (!isFormValid()) {
        throw new Error('Please fill all required fields');
      }

      const requestData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        summary: formData.summary,
        experiences: formData.experiences.map(exp => ({
          jobTitle: exp.jobTitle,
          company: exp.company,
          duration: exp.duration,
          description: exp.description
        })),
        education: formData.education.map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.year
        })),
        skills: formData.skills
      };

      const res = await axios.post(`https://mern-career-canvas-2.onrender.com/api/gemini/resume`, requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (!res.data?.success || !res.data?.result) {
        throw new Error(res.data?.error || 'Invalid response from server');
      }

      setGeneratedResume(res.data.result);
      showToast('success', 'Resume generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      let errorMessage = 'Failed to generate resume';

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid data format.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.response.data?.error || `Error ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async () => {
    if (!selectedResume) return;
    
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`https://mern-career-canvas-2.onrender.com/api/resumes/${selectedResume}`);
        
        // Update the saved resumes list
        const updatedResumes = await axios.get(`https://mern-career-canvas-2.onrender.com/api/resumes/${user.id}`);
        setSavedResumes(updatedResumes.data);
        
        if (updatedResumes.data.length > 0) {
          setSelectedResume(updatedResumes.data[0]._id);
          setFormData(updatedResumes.data[0]);
          setGeneratedResume(updatedResumes.data[0].generatedResume || "");
        } else {
          setSelectedResume(null);
          resetForm();
        }
        
        showToast('success', 'Resume deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        showToast('error', 'Failed to delete resume');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      summary: "",
      experiences: [{ id: 1, jobTitle: "", company: "", duration: "", description: "" }],
      education: [{ id: 1, degree: "", institution: "", year: "" }],
      skills: [],
    });
    setGeneratedResume("");
  };

  const showToast = (type, message) => {
    const toast = document.getElementById(`${type}-toast`);
    if (toast) {
      toast.textContent = message;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header with colored background
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 220, 40, 'F');
    
    // Name in white
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(formData.fullName.toUpperCase(), 105, 20, { align: 'center' });
    
    // Contact info
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 255);
    const contactInfo = `${formData.email} | ${formData.phone} | ${formData.address}`;
    doc.text(contactInfo, 105, 28, { align: 'center' });
    
    // Summary section
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 45, 190, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text("PROFESSIONAL SUMMARY", 15, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(formData.summary, 170);
    doc.text(splitSummary, 15, 62);
    
    // Experience section
    let yPosition = 70 + (splitSummary.length * 5);
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPosition - 5, 190, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("PROFESSIONAL EXPERIENCE", 15, yPosition + 2);
    yPosition += 15;
    
    formData.experiences.forEach(exp => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.jobTitle}`, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 64, 175);
      doc.text(`${exp.company} | ${exp.duration}`, 15, yPosition + 5);
      doc.setTextColor(30, 41, 59);
      
      const splitDesc = doc.splitTextToSize(exp.description, 170);
      doc.text(splitDesc, 15, yPosition + 12);
      yPosition += 15 + (splitDesc.length * 5);
    });
    
    // Education section
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPosition - 5, 190, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("EDUCATION", 15, yPosition + 2);
    yPosition += 15;
    
    formData.education.forEach(edu => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${edu.degree}`, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 64, 175);
      doc.text(`${edu.institution} | ${edu.year}`, 15, yPosition + 5);
      doc.setTextColor(30, 41, 59);
      yPosition += 15;
    });
    
    // Skills section
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPosition - 5, 190, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("SKILLS", 15, yPosition + 2);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Format skills as bullet points
    const skillsPerLine = 3;
    const skillLines = [];
    for (let i = 0; i < formData.skills.length; i += skillsPerLine) {
      skillLines.push(formData.skills.slice(i, i + skillsPerLine).join(" • "));
    }
    
    skillLines.forEach((line, index) => {
      doc.text("• " + line, 20, yPosition + (index * 5));
    });
    
    doc.save(`${formData.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
    
    showToast('download', 'PDF download started!');
  };

  const isFormValid = () => {
    return (
      formData.fullName &&
      formData.email &&
      formData.phone &&
      formData.summary &&
      formData.experiences.every(exp => exp.jobTitle && exp.company && exp.duration) &&
      formData.education.every(edu => edu.degree && edu.institution)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Toast Notifications */}
      <div id="save-toast" className="hidden fixed top-4 right-4 z-50">
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span id="save-toast-message">Resume saved successfully!</span>
        </div>
      </div>
      
      <div id="generate-toast" className="hidden fixed top-4 right-4 z-50">
        <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span id="generate-toast-message">Resume generated successfully!</span>
        </div>
      </div>
      
      <div id="download-toast" className="hidden fixed top-4 right-4 z-50">
        <div className="bg-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span id="download-toast-message">PDF download started!</span>
        </div>
      </div>
      
      <div id="error-toast" className="hidden fixed top-4 right-4 z-50">
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span id="error-toast-message">Error generating resume. Please try again.</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#0e7490] px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Professional Resume Builder</h1>
              <p className="text-blue-200">Create your perfect resume in minutes</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="text-blue-100 hover:text-white flex items-center bg-blue-700/30 hover:bg-blue-700/50 px-4 py-2 rounded-lg transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Dashboard
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="bg-gray-100 px-8 py-4 border-b border-gray-200">
            <div className="flex items-center">
              {['personal', 'experience', 'education', 'skills'].map((section, index) => (
                <React.Fragment key={section}>
                  <button
                    onClick={() => setActiveSection(section)}
                    className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-medium ${
                      activeSection === section 
                        ? 'bg-indigo-600 text-white border-2 border-indigo-600' 
                        : 'bg-white text-gray-600 border-2 border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                  {index < 3 && (
                    <div className={`h-1 w-16 mx-2 ${activeSection === section || (index === 0 && activeSection === 'personal') ? 'bg-indigo-200' : 'bg-gray-300'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className={`${activeSection === 'personal' ? 'text-indigo-600 font-medium' : ''}`}>Personal</span>
              <span className={`${activeSection === 'experience' ? 'text-indigo-600 font-medium' : ''}`}>Experience</span>
              <span className={`${activeSection === 'education' ? 'text-indigo-600 font-medium' : ''}`}>Education</span>
              <span className={`${activeSection === 'skills' ? 'text-indigo-600 font-medium' : ''}`}>Skills</span>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Form Section */}
              <div className="w-full lg:w-1/2">
                {/* Resume Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saved Resumes</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedResume || ''}
                      onChange={(e) => {
                        const resume = savedResumes.find(r => r._id === e.target.value);
                        setSelectedResume(e.target.value);
                        setFormData(resume);
                        setGeneratedResume(resume.generatedResume || "");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      <option value="">Select a saved resume</option>
                      {savedResumes.map(resume => (
                        <option key={resume._id} value={resume._id}>
                          {resume.fullName || 'Untitled Resume'} - {new Date(resume.updatedAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetForm();
                          setSelectedResume(null);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                      >
                        New
                      </button>
                      {selectedResume && (
                        <button
                          onClick={deleteResume}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {activeSection === 'personal' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Personal Information</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                      <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          placeholder="(123) 456-7890"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary*</label>
                      <textarea
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Describe your professional background, skills, and achievements..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Tip: Keep it concise (3-5 sentences)</p>
                    </div>
                  </div>
                )}
                
                {activeSection === 'experience' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-xl font-semibold text-gray-800">Work Experience</h2>
                      <button
                        onClick={addExperience}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Experience
                      </button>
                    </div>
                    
                    {formData.experiences.map((exp, index) => (
                      <div key={exp.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">Experience #{index + 1}</h3>
                          {formData.experiences.length > 1 && (
                            <button
                              onClick={() => removeExperience(exp.id)}
                              className="text-red-500 hover:text-red-700 text-sm flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title*</label>
                            <input
                              name="jobTitle"
                              value={exp.jobTitle}
                              onChange={(e) => handleArrayChange("experiences", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="Software Engineer"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company*</label>
                            <input
                              name="company"
                              value={exp.company}
                              onChange={(e) => handleArrayChange("experiences", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="Tech Corp Inc."
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration*</label>
                            <input
                              name="duration"
                              value={exp.duration}
                              onChange={(e) => handleArrayChange("experiences", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="Jan 2020 - Present"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              name="description"
                              value={exp.description}
                              onChange={(e) => handleArrayChange("experiences", index, e)}
                              rows="4"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="Describe your responsibilities and achievements..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Use bullet points for better readability</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeSection === 'education' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-xl font-semibold text-gray-800">Education</h2>
                      <button
                        onClick={addEducation}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Education
                      </button>
                    </div>
                    
                    {formData.education.map((edu, index) => (
                      <div key={edu.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">Education #{index + 1}</h3>
                          {formData.education.length > 1 && (
                            <button
                              onClick={() => removeEducation(edu.id)}
                              className="text-red-500 hover:text-red-700 text-sm flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Degree*</label>
                            <input
                              name="degree"
                              value={edu.degree}
                              onChange={(e) => handleArrayChange("education", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="Bachelor of Science in Computer Science"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Institution*</label>
                            <input
                              name="institution"
                              value={edu.institution}
                              onChange={(e) => handleArrayChange("education", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="University of Technology"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <input
                              name="year"
                              value={edu.year}
                              onChange={(e) => handleArrayChange("education", index, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              placeholder="2016 - 2020"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeSection === 'skills' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Skills</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Add Skills</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          placeholder="e.g., JavaScript, Project Management, Photoshop"
                        />
                        <button
                          onClick={addSkill}
                          className="bg-indigo-600 text-white px-4 py-3 rounded-r-lg hover:bg-indigo-700 transition flex items-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Press Enter or click the + button to add</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Your Skills ({formData.skills.length})</h3>
                      {formData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <div key={index} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full flex items-center shadow-sm">
                              <span>{skill}</span>
                              <button
                                onClick={() => removeSkill(skill)}
                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                          <p className="text-sm text-gray-500">No skills added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-8 flex gap-4">
                  {activeSection !== 'personal' && (
                    <button
                      onClick={() => setActiveSection(activeSection === 'experience' ? 'personal' : activeSection === 'education' ? 'experience' : 'education')}
                      className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-medium flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      Previous
                    </button>
                  )}
                  
                  {activeSection !== 'skills' ? (
                    <button
                      onClick={() => setActiveSection(activeSection === 'personal' ? 'experience' : activeSection === 'experience' ? 'education' : 'skills')}
                      className={`flex-1 py-3 rounded-lg transition font-medium flex items-center justify-center ${
                        isFormValid() 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-4">
                      <button
                        onClick={saveResume}
                        disabled={!isFormValid()}
                        className={`flex-1 py-3 rounded-lg transition font-medium flex items-center justify-center ${
                          isFormValid() 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        Save
                      </button>
                      <button
                        onClick={generateResume}
                        disabled={loading || !isFormValid()}
                        className={`flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center ${
                          loading || !isFormValid() ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                           AI Assist
                          </>
                        )}
                      </button>
                      
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="w-full lg:w-1/2">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 h-full sticky top-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Resume Preview</h2>
                    {(selectedResume || generatedResume) && (
                      <button
                        onClick={downloadPDF}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download
                      </button>
                    )}
                  </div>
                  
                  {selectedResume || generatedResume ? (
                    <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg h-[calc(100%-60px)] overflow-y-auto">
                      {/* Resume Preview Content */}
                      <div className="bg-blue-800 text-white p-6 rounded-t-lg">
                        <h3 className="text-2xl font-bold uppercase tracking-wide">{formData.fullName}</h3>
                        <p className="text-blue-200 mt-1">{formData.email} | {formData.phone} | {formData.address}</p>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-800 pb-1 mb-3">PROFESSIONAL SUMMARY</h4>
                          <p className="text-gray-700">{formData.summary}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-800 pb-1 mb-3">PROFESSIONAL EXPERIENCE</h4>
                          {formData.experiences.map((exp, index) => (
                            <div key={index} className="mb-4">
                              <h5 className="font-bold text-gray-800">{exp.jobTitle}</h5>
                              <p className="text-blue-800 font-medium">{exp.company} | {exp.duration}</p>
                              <p className="text-gray-700 mt-2 whitespace-pre-line">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-800 pb-1 mb-3">EDUCATION</h4>
                          {formData.education.map((edu, index) => (
                            <div key={index} className="mb-2">
                              <h5 className="font-bold text-gray-800">{edu.degree}</h5>
                              <p className="text-blue-800 font-medium">{edu.institution} | {edu.year}</p>
                            </div>
                          ))}
                        </div>
                        
                        {formData.skills.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-800 pb-1 mb-3">SKILLS</h4>
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.map((skill, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 text-center rounded-lg border-2 border-dashed border-gray-300 h-[calc(100%-60px)] flex flex-col items-center justify-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Your resume preview will appear here</h3>
                      <p className="mt-2 text-sm text-gray-500">Fill out the form and click "Generate" to see a preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {generatedResume && (
  <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
    {/* Header with action buttons */}
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">Generated Resume</h2>
      <div className="flex gap-3">
        <button
          onClick={downloadPDF}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          PDF
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(generatedResume)}
          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
          </svg>
          Copy
        </button>
      </div>
    </div>

    {/* Resume content with enhanced styling */}
    <div className="p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
        <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
          {generatedResume.split('\n').map((line, i) => (
            <div 
              key={i} 
              className={`
                ${line.trim() === '' ? 'h-4' : ''}
                ${line.match(/^[A-Z\s]+$/) ? 'font-bold text-lg mt-4 mb-2 text-indigo-700' : ''}
                ${line.startsWith('•') ? 'ml-4 pl-2 border-l-2 border-indigo-200' : ''}
              `}
            >
              {line}
            </div>
          ))}
        </pre>
      </div>
    </div>

    {/* Optional: Edit suggestions */}
    <div className="bg-blue-50 px-6 py-4 border-t border-blue-100">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Pro Tip:</h3>
      <p className="text-sm text-blue-700">
        Review and customize the generated resume before downloading. Pay special attention to:
      </p>
      <ul className="mt-1 text-sm text-blue-600 list-disc list-inside">
        <li>Quantifiable achievements</li>
        <li>Job-specific keywords</li>
        <li>Consistent verb tenses</li>
      </ul>
    </div>
  </div>
)}

    </div>
  );

}