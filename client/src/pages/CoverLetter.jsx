import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function CoverLetter() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantAddress: "",
    hiringManager: "",
    companyName: "",
    jobTitle: "",
    jobSource: "",
    skills: "",
    achievements: ""
  });

  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [savedLetters, setSavedLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const navigate = useNavigate();

  const API_URL = "https://mern-career-canvas-2.onrender.com";

  // Load user's saved cover letters
  useEffect(() => {
    if (user) {
      const fetchLetters = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/coverletters/${user.id}`);
          setSavedLetters(response.data);
          if (response.data.length > 0) {
            setSelectedLetter(response.data[0]._id);
            setFormData(response.data[0]);
            setGeneratedLetter(response.data[0].generatedLetter || "");
          }
        } catch (error) {
          console.error('Error fetching cover letters:', error);
          showToast('error', 'Failed to load saved cover letters');
        }
      };
      fetchLetters();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveCoverLetter = async () => {
    try {
      let response;
      if (selectedLetter) {
        // Update existing cover letter
        response = await axios.put(`${API_URL}/api/coverletters/${selectedLetter}`, {
          ...formData,
          userId: user.id,
          generatedLetter
        });
      } else {
        // Create new cover letter
        response = await axios.post(`${API_URL}/api/coverletters`, {
          ...formData,
          userId: user.id,
          generatedLetter
        });
        setSelectedLetter(response.data._id);
      }

      // Update the saved letters list
      const updatedLetters = await axios.get(`${API_URL}/api/coverletters/${user.id}`);
      setSavedLetters(updatedLetters.data);

      showToast('success', 'Cover letter saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      showToast('error', 'Failed to save cover letter');
    }
  };

  const generateCoverLetter = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/gemini/coverletter`,
        {
          applicantName: formData.applicantName,
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          skills: formData.skills,
          achievements: formData.achievements
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!res.data?.success || !res.data?.result) {
        throw new Error(res.data?.error || 'Invalid response from server');
      }

      setGeneratedLetter(res.data.result);
      showToast('success', 'Cover letter generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      let errorMessage = 'Failed to generate cover letter';
      
      if (error.response) {
        errorMessage = error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteCoverLetter = async () => {
    if (!selectedLetter) return;
    
    if (window.confirm('Are you sure you want to delete this cover letter?')) {
      try {
        await axios.delete(`${API_URL}/api/coverletters/${selectedLetter}`);
        
        // Update the saved letters list
        const updatedLetters = await axios.get(`${API_URL}/api/coverletters/${user.id}`);
        setSavedLetters(updatedLetters.data);
        
        if (updatedLetters.data.length > 0) {
          setSelectedLetter(updatedLetters.data[0]._id);
          setFormData(updatedLetters.data[0]);
          setGeneratedLetter(updatedLetters.data[0].generatedLetter || "");
        } else {
          setSelectedLetter(null);
          resetForm();
        }
        
        showToast('success', 'Cover letter deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        showToast('error', 'Failed to delete cover letter');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      applicantAddress: "",
      hiringManager: "",
      companyName: "",
      jobTitle: "",
      jobSource: "",
      skills: "",
      achievements: ""
    });
    setGeneratedLetter("");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Set styles
    doc.setFont("helvetica");
    doc.setFontSize(12);
    
    // Applicant Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(formData.applicantName, 20, 20);
    doc.setFontSize(10);
    doc.text(`${formData.applicantAddress} | ${formData.applicantPhone} | ${formData.applicantEmail}`, 20, 26);
    
    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.text(dateStr, 170, 20, { align: 'right' });
    
    // Hiring Manager Info
    doc.setFontSize(12);
    doc.text(formData.hiringManager || "Hiring Manager", 20, 40);
    doc.text(formData.companyName, 20, 46);
    
    // Salutation
    doc.text(`Dear ${formData.hiringManager ? formData.hiringManager.split(' ')[0] : 'Hiring Manager'}:`, 20, 60);
    
    // Body
    const bodyText = generatedLetter.split('\n\n');
    let yPosition = 80;
    
    bodyText.forEach(paragraph => {
      const lines = doc.splitTextToSize(paragraph, 170);
      doc.text(lines, 20, yPosition);
      yPosition += (lines.length * 6) + 4;
    });
    
    // Closing
    doc.text("Sincerely,", 20, yPosition + 20);
    doc.text(formData.applicantName, 20, yPosition + 30);
    
    doc.save(`${formData.applicantName.replace(/\s+/g, '_')}_Cover_Letter.pdf`);
    
    showToast('download', 'PDF download started!');
  };

  const showToast = (type, message) => {
    const toast = document.getElementById(`${type}-toast`);
    if (toast) {
      toast.textContent = message;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }
  };

  const isFormValid = () => {
    return (
      formData.applicantName &&
      formData.applicantEmail &&
      formData.applicantPhone &&
      formData.companyName &&
      formData.jobTitle
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
          <span id="save-toast-message">Cover letter saved successfully!</span>
        </div>
      </div>
      
      <div id="generate-toast" className="hidden fixed top-4 right-4 z-50">
        <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span id="generate-toast-message">Cover letter generated successfully!</span>
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
          <span id="error-toast-message">Error generating cover letter. Please try again.</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#2c2c2c] via-[#3e3e3e] to-[#f59e0b] px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Professional Cover Letter Generator</h1>
              <p className="text-green-200">Create your perfect cover letter in minutes</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="text-green-100 hover:text-white flex items-center bg-green-700/30 hover:bg-green-700/50 px-4 py-2 rounded-lg transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Dashboard
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="bg-gray-100 px-8 py-4 border-b border-gray-200">
            <div className="flex items-center justify-center">
              {['personal', 'job', 'qualifications'].map((section, index) => (
                <React.Fragment key={section}>
                  <button
                    onClick={() => setActiveSection(section)}
                    className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-medium ${
                      activeSection === section 
                        ? 'bg-green-600 text-white border-2 border-green-600' 
                        : 'bg-white text-gray-600 border-2 border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                  {index < 2 && (
                    <div className={`h-1 w-16 mx-2 ${activeSection === section || (index === 0 && activeSection === 'personal') ? 'bg-green-200' : 'bg-gray-300'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-center mt-2 text-xs text-gray-500 space-x-16">
              <span className={`${activeSection === 'personal' ? 'text-green-600 font-medium' : ''}`}>Personal</span>
              <span className={`${activeSection === 'job' ? 'text-green-600 font-medium' : ''}`}>Job Info</span>
              <span className={`${activeSection === 'qualifications' ? 'text-green-600 font-medium' : ''}`}>Qualifications</span>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Form Section */}
              <div className="w-full lg:w-1/2">
                {/* Cover Letter Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saved Cover Letters</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedLetter || ''}
                      onChange={(e) => {
                        const letter = savedLetters.find(l => l._id === e.target.value);
                        setSelectedLetter(e.target.value);
                        setFormData(letter);
                        setGeneratedLetter(letter.generatedLetter || "");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="">Select a saved cover letter</option>
                      {savedLetters.map(letter => (
                        <option key={letter._id} value={letter._id}>
                          {letter.jobTitle || 'Untitled Letter'} - {new Date(letter.updatedAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetForm();
                          setSelectedLetter(null);
                        }}
                        className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                      >
                        New
                      </button>
                      {selectedLetter && (
                        <button
                          onClick={deleteCoverLetter}
                          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
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
                        name="applicantName"
                        value={formData.applicantName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                        <input
                          name="applicantEmail"
                          type="email"
                          value={formData.applicantEmail}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                        <input
                          name="applicantPhone"
                          value={formData.applicantPhone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="(123) 456-7890"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        name="applicantAddress"
                        value={formData.applicantAddress}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                )}
                
                {activeSection === 'job' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Job Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Manager's Name</label>
                        <input
                          name="hiringManager"
                          value={formData.hiringManager}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="Sarah Johnson"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name*</label>
                        <input
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="Tech Innovations Inc."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title*</label>
                        <input
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="Senior Software Engineer"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Where You Found the Job</label>
                        <input
                          name="jobSource"
                          value={formData.jobSource}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="LinkedIn, Company Website, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeSection === 'qualifications' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Your Qualifications</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Skills</label>
                        <textarea
                          name="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="List skills that match the job requirements..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Separate skills with commas for better formatting</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                        <textarea
                          name="achievements"
                          value={formData.achievements}
                          onChange={handleChange}
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="Describe your professional achievements..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Focus on measurable results and impacts</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 flex gap-4">
                  {activeSection !== 'personal' && (
                    <button
                      onClick={() => setActiveSection(activeSection === 'job' ? 'personal' : 'job')}
                      className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-medium flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      Previous
                    </button>
                  )}
                  
                  {activeSection !== 'qualifications' ? (
                    <button
                      onClick={() => setActiveSection(activeSection === 'personal' ? 'job' : 'qualifications')}
                      className={`w-full max-w-[200px] py-3 px-6 rounded-xl transition duration-300 font-semibold text-lg flex items-center justify-center gap-2 ${
                        isFormValid() 
                          ? 'bg-[#ff9900] text-white hover:bg-[#e68a00]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-4">
                      <button
                        onClick={saveCoverLetter}
                        className="flex-1 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-medium flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        Save
                      </button>
                      <button
                        onClick={generateCoverLetter}
                        disabled={loading || !isFormValid()}
                        className={`flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center ${
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
                    <h2 className="text-xl font-semibold text-gray-800">Cover Letter Preview</h2>
                    {generatedLetter && (
                      <button
                        onClick={downloadPDF}
                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download
                      </button>
                    )}
                  </div>
                  
                  {selectedLetter || generatedLetter ? (
                    <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg h-[calc(100%-60px)] overflow-y-auto font-serif">
                      {/* Cover Letter Preview Content */}
                      <div className="mb-6">
                        <p className="text-gray-800 font-bold text-lg">{formData.applicantName}</p>
                        <p className="text-gray-600 text-sm">
                          {formData.applicantAddress} | {formData.applicantPhone} | {formData.applicantEmail}
                        </p>
                      </div>
                      
                      <div className="text-right mb-6">
                        <p className="text-gray-600">
                          {new Date().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      
                      <div className="mb-6">
                        <p className="text-gray-800">
                          {formData.hiringManager || "Hiring Manager"}
                        </p>
                        <p className="text-gray-800">
                          {formData.companyName}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-800">
                          Dear {formData.hiringManager ? formData.hiringManager.split(' ')[0] : 'Hiring Manager'}:
                        </p>
                      </div>
                      
                      {generatedLetter ? (
                        <div className="space-y-4 text-gray-700">
                          {generatedLetter.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          <p>Your generated cover letter will appear here after you click "Generate".</p>
                        </div>
                      )}
                      
                      <div className="mt-8">
                        <p className="text-gray-800">Sincerely,</p>
                        <p className="text-gray-800 font-bold mt-4">
                          {formData.applicantName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 text-center rounded-lg border-2 border-dashed border-gray-300 h-[calc(100%-60px)] flex flex-col items-center justify-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Your cover letter preview will appear here</h3>
                      <p className="mt-2 text-sm text-gray-500">Fill out the form and click "Generate" to see a preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}