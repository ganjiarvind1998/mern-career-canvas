


import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiEndpoint: "https://generativelanguage.googleapis.com/v1"
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

async function generateWithGemini(prompt, retries = 3) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
      safetySettings
    });

    const result = await model.generateContent([prompt]);
    const text = result.response.candidates[0].content.parts[0].text;

    if (!text) throw new Error("No text in response");

    return text;
  } catch (error) {
    console.error(`Attempt ${4 - retries} failed:`, error.message);

    if (retries > 0) {
      const waitTime = Math.pow(2, 4 - retries) * 1000;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithGemini(prompt, retries - 1);
    }

    throw error;
  }
}

// ✅ Enhanced Cover Letter Generator
export const generateCoverLetter = async (req, res) => {
  try {
    const { 
      applicantName, 
      companyName, 
      jobTitle, 
      skills, 
      achievements,
      jobSource = '',
      hiringManager = 'Hiring Manager',
      companyAddress = ''
    } = req.body;

    // Validation
    if (!applicantName || !companyName || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: applicantName, companyName, and jobTitle are required'
      });
    }

    const prompt = `
    Generate a professional cover letter with the following specifications:

    ### FORMATTING RULES:
    1. Business letter format with proper spacing
    2. Current date at the top (format: Month Day, Year)
    3. 3-4 paragraphs total length (250-350 words)
    4. Double line breaks between paragraphs
    5. Formal but engaging tone

    ### CONTENT STRUCTURE:
    [Your Name]
    [Your Contact Information]
    [Date]

    [Hiring Manager's Name]
    [Company Name]
    [Company Address]

    Dear [Hiring Manager's Name],

    [Opening Paragraph]
    - Mention the position you're applying for
    - Express enthusiasm about the role
    - Reference where you found the posting
    - Brief introduction of your professional background

    [Skills Paragraph]
    Highlight 2-3 most relevant skills:
    ${skills || 'Not specified'}
    - Provide specific examples of using these skills
    - Relate directly to job requirements
    - Use action verbs (developed, implemented, optimized)

    [Achievements Paragraph]
    Showcase 1-2 key achievements:
    ${achievements || 'Not specified'}
    - Quantify results (increased X by Y%, reduced costs by $Z)
    - Focus on measurable impacts
    - Align with company needs

    [Closing Paragraph]
    - Reiterate interest in the role
    - Request an interview opportunity
    - Provide contact availability
    - Thank the reader for their consideration

    Sincerely,
    [Your Name]

    ### SPECIFIC INSTRUCTIONS:
    1. For: ${applicantName} applying to ${jobTitle} at ${companyName}
    2. Found via: ${jobSource || 'job posting'}
    3. Address to: ${hiringManager}
    4. Company address: ${companyAddress || 'Not specified'}
    5. Include measurable results where possible
    6. Avoid generic phrases like "team player"
    7. Tailor to ${companyName}'s industry

    ### EXAMPLE CONTENT:
    "At my previous role at TechSolutions, I led a team that developed a customer portal..."
    "Implemented a new inventory system that reduced processing time by 30%..."
    `;

    const generatedText = await generateWithGemini(prompt);

    // Post-processing
    const formattedLetter = generatedText
      .replace(/^\s*\n/gm, '') // Remove empty lines at start
      .replace(/\n{3,}/g, '\n\n') // Limit to 2 line breaks max
      .replace(/(Dear .+:)\s*/g, '$1\n\n') // Space after salutation
      .replace(/(Sincerely,)\s*/g, '\n\n$1\n\n') // Format signature
      .replace(/\[.*?\]/g, '') // Remove any remaining placeholders
      .trim();

    res.json({
      success: true,
      result: formattedLetter
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message.includes('quota')
        ? 'API quota exceeded. Please try again later.'
        : `Failed to generate cover letter: ${error.message}`
    });
  }
};

// ✅ Professional Resume Generator
export const generateResume = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      summary,
      experiences = [],
      education = [],
      skills = [],
      certifications = [],
      projects = []
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, email, phone, and summary are required'
      });
    }

    const prompt = `
    Generate a professional resume with these specifications:

    ### FORMATTING RULES:
    1. Clean, single-column layout
    2. Name as title in larger font
    3. Contact information below name
    4. Reverse-chronological order
    5. Clear section headings (ALL CAPS, bold)
    6. Bullet points for achievements
    7. Consistent spacing (1 line between sections)

    ### REQUIRED SECTIONS:
    [CONTACT INFORMATION]
    ${fullName}
    ${address || ''}
    ${phone} | ${email}

    [PROFESSIONAL SUMMARY]
    - 3-4 sentence overview
    - Include: years of experience, key skills
    - Highlight major achievements
    - Tailor to target role

    [PROFESSIONAL EXPERIENCE]
    ${experiences.map(exp => `
    ${exp.company.toUpperCase()} | ${exp.duration}
    ${exp.jobTitle}
    • ${exp.description.replace(/\n/g, '\n    • ')}
    `).join('\n')}

    [EDUCATION]
    ${education.map(edu => `
    ${edu.institution.toUpperCase()} | ${edu.year}
    ${edu.degree}
    ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
    `).join('\n')}

    ${skills.length ? `
    [TECHNICAL SKILLS]
    • ${skills.join('\n    • ')}
    ` : ''}

    ${certifications.length ? `
    [CERTIFICATIONS]
    • ${certifications.join('\n    • ')}
    ` : ''}

    ${projects.length ? `
    [KEY PROJECTS]
    ${projects.map(proj => `
    ${proj.name.toUpperCase()} | ${proj.technologies}
    • ${proj.description.replace(/\n/g, '\n    • ')}
    `).join('\n')}
    ` : ''}

    ### CONTENT REQUIREMENTS:
    1. Begin bullet points with strong action verbs
    2. Quantify achievements (metrics, percentages)
    3. Focus on results over responsibilities
    4. Keep professional tone (no pronouns)
    5. Tailor to ${summary.includes('technical') ? 'technical' : 'professional'} roles

    ### EXAMPLE FORMAT:
    SOFTWARE ENGINEER | TECH COMPANY | 2020-Present
    • Developed 15+ microservices improving efficiency by 40%
    • Led team of 5 to deliver project 3 weeks early
    • Reduced server costs by $25K/year through optimization

    Do not include any placeholder text like [Your Name].
    `;

    const generatedText = await generateWithGemini(prompt);

    // Post-processing
    const formattedResume = generatedText
      .replace(/([A-Z ]+)\n/g, '\n$1\n') // Format section headers
      .replace(/•\s*/g, '• ') // Standardize bullets
      .replace(/\n{3,}/g, '\n\n') // Limit line breaks
      .replace(/([^\n])\n([^\n•])/g, '$1 $2') // Fix mid-sentence breaks
      .replace(/\[.*?\]/g, '') // Remove placeholders
      .trim();

    res.json({
      success: true,
      result: formattedResume
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message.includes('quota')
        ? 'API quota exceeded. Please try again later.'
        : `Failed to generate resume: ${error.message}`
    });
  }
};

// Export all generators
export default {
  generateCoverLetter,
  generateResume
};
