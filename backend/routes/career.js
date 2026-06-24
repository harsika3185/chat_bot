const express = require('express');
const router = express.Router();
const CareerPlan = require('../models/CareerPlan');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getGeminiClient, handleGeminiError } = require('../utils/gemini');

// Helper: function to parse clean JSON from model output strings
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

// @desc    Generate career recommendations based on user profile
// @route   POST /api/career/recommendations
// @access  Private
router.post('/recommendations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = user.profile || {};
    let recommendations = [];

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
        You are an expert career counselor. Analyze this student/professional profile:
        Degree: ${profile.degree || 'Not specified'}
        Department: ${profile.department || 'Not specified'}
        Current Year: ${profile.currentYear || 'Not specified'}
        Skills: ${profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'Not specified'}
        Areas of Interest: ${profile.areasOfInterest && profile.areasOfInterest.length > 0 ? profile.areasOfInterest.join(', ') : 'Not specified'}
        Career Goal: ${profile.careerGoal || 'Not specified'}

        Provide exactly 3 suitable career path recommendations. Return a JSON object with this exact structure (do not write any markdown code blocks, just raw JSON text. No leading or trailing characters):
        {
          "recommendations": [
            {
              "title": "Job Title",
              "suitabilityReason": "Detailed explanation of why this matches their skills and interests.",
              "salaryRange": "$75,000 - $110,000",
              "growthOpportunities": "Detailed explanation of industry trends, growth metrics, and future career steps.",
              "priority": 1
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('Received an empty response from Google Gemini.');
      }

      const text = result.response.text();
      const parsed = parseAIJSON(text);
      recommendations = parsed.recommendations || [];
      
      if (recommendations.length === 0) {
        throw new Error('Gemini did not return any recommendations in the JSON schema.');
      }
    } catch (aiErr) {
      const mapped = handleGeminiError(aiErr);
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    // Save recommendations in the database (or update existing)
    let plan = await CareerPlan.findOne({ userId: req.user._id });
    if (plan) {
      plan.recommendations = recommendations;
      await plan.save();
    } else {
      plan = await CareerPlan.create({
        userId: req.user._id,
        recommendations
      });
    }

    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get latest career recommendations for user
// @route   GET /api/career/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    const plan = await CareerPlan.findOne({ userId: req.user._id });
    res.json({ success: true, plan: plan || { recommendations: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate personalized learning roadmap & courses based on target career
// @route   POST /api/career/roadmap
// @access  Private
router.post('/roadmap', protect, async (req, res) => {
  const { targetCareer } = req.body;
  if (!targetCareer) {
    return res.status(400).json({ success: false, message: 'Please provide a target career' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = user.profile || {};
    let roadmapData = null;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
        You are an expert technical educator and career counselor. Create a personalized learning roadmap for a user who wants to become a: ${targetCareer}.
        Their current profile:
        Skills: ${profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'Not specified'}
        Interests: ${profile.areasOfInterest && profile.areasOfInterest.length > 0 ? profile.areasOfInterest.join(', ') : 'Not specified'}
        Goal: ${profile.careerGoal || 'Not specified'}

        Please analyze their current skills versus the target career, and provide:
        1. A skill gap analysis (existing skills, missing skills, priority skills to learn).
        2. A 30-day roadmap (focused on quick wins and fundamentals).
        3. A 90-day roadmap (focused on intermediate projects and deep-dives).
        4. A 6-month roadmap (focused on advanced topics, portfolio building, and job search ready).
        5. 3 course recommendations (one free resource, one certification, one YouTube learning path).

        Return a JSON object with this exact structure (do not write any markdown code blocks, just raw JSON text. No leading or trailing characters):
        {
          "timeline": {
            "thirtyDays": "Detailed markdown formatted text for the 30-day timeline.",
            "ninetyDays": "Detailed markdown formatted text for the 90-day timeline.",
            "sixMonths": "Detailed markdown formatted text for the 6-month timeline."
          },
          "courses": [
            { "type": "free", "name": "Course Name", "provider": "Coursera/edX/etc", "link": "http://example.com" },
            { "type": "certification", "name": "Certification Name", "provider": "AWS/Google/Microsoft/etc", "link": "http://example.com" },
            { "type": "youtube", "name": "YouTube Playlist Name", "provider": "FreeCodeCamp/etc", "link": "http://example.com" }
          ],
          "skillGap": {
            "existingSkills": ["skill1", "skill2"],
            "missingSkills": ["missing1", "missing2"],
            "prioritySkills": ["priority1", "priority2"]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('Received an empty response from Google Gemini.');
      }

      const text = result.response.text();
      roadmapData = parseAIJSON(text);
    } catch (aiErr) {
      const mapped = handleGeminiError(aiErr);
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    // Save or update roadmap in DB
    let roadmap = await Roadmap.findOne({ userId: req.user._id });
    if (roadmap) {
      roadmap.targetCareer = targetCareer;
      roadmap.timeline = roadmapData.timeline;
      roadmap.courses = roadmapData.courses;
      roadmap.skillGap = roadmapData.skillGap;
      await roadmap.save();
    } else {
      roadmap = await Roadmap.create({
        userId: req.user._id,
        targetCareer,
        timeline: roadmapData.timeline,
        courses: roadmapData.courses,
        skillGap: roadmapData.skillGap
      });
    }

    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get latest roadmap for user
// @route   GET /api/career/roadmap
// @access  Private
router.get('/roadmap', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user._id });
    res.json({ success: true, roadmap: roadmap || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
