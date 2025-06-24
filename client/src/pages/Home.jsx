

import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import robotTyping from "../animations/robotTyping.json";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useUser(); // 👈 Clerk user
  const [isHovered, setIsHovered] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
const [showVoicePrompt, setShowVoicePrompt] = useState(false);
  const images = [
    "https://magicalapi.com/blog/wp-content/uploads/2024/12/19-1248x702.jpg",
    "https://jobbloghq.com/wp-content/uploads/2024/05/AI-cover-letter-1030x589.jpg",
    "https://www.ststechnicaljobs.com/wp-content/uploads/2024/01/Harnessing-AI-to-Elevate-Your-Resume-A-Guide-for-Job-Seekers.jpg",
  ];
 // ✅ Trigger modal if user is signed in and hasn't heard voice
  useEffect(() => {
    const alreadySpoken = sessionStorage.getItem("welcomePlayed");
    if (user?.firstName && !alreadySpoken) {
      setShowVoicePrompt(true);
    }
  }, [user]);

  // ✅ Voice playback on button click
  const handlePlayVoice = () => {
    if (!user?.firstName) return;
    sessionStorage.setItem("welcomePlayed", "true");
    setShowVoicePrompt(false);

    const msg = new SpeechSynthesisUtterance(
      `Welcome ${user.firstName}, let's build your resume with AI.`
    );
    msg.lang = "en-US";
    msg.pitch = 1;
    msg.rate = 1;
    msg.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#fff8e1] to-[#fce8e6] overflow-hidden relative">
      {/* Floating accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4285F4] rounded-full filter blur-[110px] opacity-15 animate-float"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#EA4335] rounded-full filter blur-[120px] opacity-15 animate-float-delay"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#FBBC05] rounded-full filter blur-[100px] opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#34A853] rounded-full filter blur-[90px] opacity-15 animate-float"></div>
      </div>

      {/* Floating doc animation */}
      <motion.div
        className="absolute top-1/4 right-10 w-48 hidden lg:block"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <svg className="w-full h-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        className="flex justify-between items-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-blue-600">Career</span>Canvas
          </h1>
          <p className="text-gray-600">AI-Powered Professional Toolkit</p>
        </div>
        <UserButton appearance={{ elements: { userButtonAvatarBox: "h-10 w-10" } }} />
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Craft Your <span className="text-blue-600">Professional</span> Identity
          </h2>

          {/* 👋 Welcome Message */}
          <p className="text-lg text-gray-800 font-medium">
            👋 Welcome {user?.firstName}, let's build your resume with AI!
          </p>

          <p className="text-xl text-gray-600 mt-3 max-w-2xl mx-auto">
            Create stunning resumes and compelling cover letters that get you noticed
          </p>
          
        </motion.div>

        {/* Robot Animation */}
        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="w-64 md:w-80 -mt-4 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: 0.3 }}
          >
            <Lottie animationData={robotTyping} loop={true} />
          </motion.div>

          <motion.div
            className="text-lg md:text-xl font-semibold text-gray-700 bg-white px-6 py-2 rounded-full shadow-md border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            ✍️ AI Robot is writing your Resume live...
          </motion.div>
        </motion.div>

        

      {/* Rotating preview panel */}
        <div className="mb-16 rounded-xl overflow-hidden shadow-xl bg-white max-w-3xl mx-auto">
          <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
            {images.map((img, index) => (
              <motion.img
                key={index}
                src={img}
                alt="Feature preview"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentImage === index ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-3 h-3 rounded-full ${currentImage === index ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <Link
            to="/resume"
            className="group"
            onMouseEnter={() => setIsHovered('resume')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative"
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-center mb-6">
                  <motion.div 
                    className="bg-blue-100 p-4 rounded-full"
                    animate={{
                      scale: isHovered === 'resume' ? 1.1 : 1,
                      rotate: isHovered === 'resume' ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-3">Resume Builder</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create a professional resume tailored to your dream job with our AI-powered builder
                </p>
                <div className="flex justify-center">
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center shadow-md hover:shadow-lg">
                    Get Started
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          </Link>

          <Link
            to="/coverletter"
            className="group"
            onMouseEnter={() => setIsHovered('coverletter')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative"
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-center mb-6">
                  <motion.div 
                    className="bg-green-100 p-4 rounded-full"
                    animate={{
                      scale: isHovered === 'coverletter' ? 1.1 : 1,
                      rotate: isHovered === 'coverletter' ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-3">Cover Letter Generator</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create impactful cover letters that bring an extra spark and make recruiters remember your name
                </p>
                <div className="flex justify-center">
                  <button className="px-6 py-2 bg-gradient-to-r from-[#fde68a] via-[#f6c34c] to-[#f59e0b] text-black rounded-full font-semibold hover:from-[#fcd34d] hover:to-[#fbbf24] transition duration-300 shadow-md hover:shadow-lg flex items-center gap-2">
                    Get Started
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          </Link>
        </div>

        {/* Testimonial section */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center mb-4">
            <div className="text-yellow-400 text-2xl mr-2">★ ★ ★ ★ ★</div>
          </div>
          <p className="text-gray-700 text-lg italic mb-6">
            "CareerCanvas helped me create a resume that got me interviews at three Fortune 500 companies. The AI suggestions were incredibly helpful in highlighting my most relevant skills."
          </p>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Sarah Johnson</h4>
              <p className="text-gray-600">Product Manager at TechCorp</p>
            </div>
          </div>
        </motion.div>
      </div>


<motion.div 
          className="mt-16 pt-8 border-t border-gray-200 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-500 mb-4">
            © {new Date().getFullYear()} CareerCanvas. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
            </a>
          </div>
          {showVoicePrompt && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg text-center">
      <h2 className="text-lg font-bold mb-2">👋{user?.firstName}!</h2>
      {/* <p className="mb-4">Click to hear the welcome message</p> */}
      <button
        onClick={handlePlayVoice}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
      >
        Start
      </button>
    </div>
  </div>
)}



        </motion.div>
      
      
    </div>
  );
}



