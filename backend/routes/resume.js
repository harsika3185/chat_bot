const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getGeminiClient, handleGeminiError } = require('../utils/gemini');

// Multer memory storage (keeps server disk clean)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// Helper: clean markdown JSON wrappers
const parseAIJSON = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (err) {
    console.error('Error parsing JSON from Gemini text:', text, err);
    throw new Error('Failed to parse a valid JSON payload from the Gemini API output.');
  }
};

// @desc    Upload PDF resume & analyze ATS compatibility
// @route   POST /api/resume/analyze
// @access  Private
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
  }

  try {
    const user = await User.findById(req.user._id);
    const careerGoal = user.profile ? user.profile.careerGoal : 'Software Engineer';

    // Parse the PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    let analysisResults = null;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
        You are an expert ATS (Applicant Tracking System) optimizer and professional recruiter.
        The user wants to align their resume with their career goal: ${careerGoal || 'Software Engineer'}.
        Below is the extracted plain text from their PDF resume:
        ---
        ${resumeText}
        ---

        Analyze the resume and return a JSON object with this exact structure (do not write any markdown code blocks, just raw JSON text. No leading or trailing characters):
        {
          "atsScore": 75,
          "missingSkills": ["skill1", "skill2"],
          "suggestions": [
            "Suggestion 1: Format change...",
            "Suggestion 2: Add keyword..."
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('Received an empty response from Google Gemini.');
      }

      const text = result.response.text();
      analysisResults = parseAIJSON(text);
    } catch (aiErr) {
      const mapped = handleGeminiError(aiErr);
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    // Save analysis to DB
    const analysis = await ResumeAnalysis.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      atsScore: analysisResults.atsScore,
      missingSkills: analysisResults.missingSkills,
      suggestions: analysisResults.suggestions
    });

    res.status(201).json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all resume analysis history for user
// @route   GET /api/resume/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
