const express = require('express');
const router = express.Router();
const CareerPlan = require('../models/CareerPlan');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateContentWithRetry } = require('../utils/gemini');

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

    try {
      const text = await generateContentWithRetry(prompt, { 
        generationConfig: { responseMimeType: 'application/json' }
      });
      const parsed = parseAIJSON(text);
      recommendations = parsed.recommendations || [];
    } catch (aiErr) {
      console.warn('Gemini API failed after all retries. Serving graceful fallback career recommendations.');
      recommendations = [
        {
          "title": "Software Engineer",
          "suitabilityReason": `Matches common interest in building applications and programming skills. Fits your goal: ${profile.careerGoal || 'Software Engineering'}.`,
          "salaryRange": "$80,000 - $120,000",
          "growthOpportunities": "High demand across multiple industries. Opportunities to advance to Senior Developer or Architect roles.",
          "priority": 1
        },
        {
          "title": "Data Analyst",
          "suitabilityReason": "Matches analytical mindset, data operations and general technical credentials.",
          "salaryRange": "$65,000 - $95,000",
          "growthOpportunities": "Growing field due to big data. Opportunities to transition into Data Science or Business Intelligence.",
          "priority": 2
        },
        {
          "title": "Product Manager",
          "suitabilityReason": "Good match for coordinating projects, bridging technical teams and business goals.",
          "salaryRange": "$85,000 - $130,000",
          "growthOpportunities": "Strong upward trajectory to Director or VP level roles.",
          "priority": 3
        }
      ];
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

    try {
      const text = await generateContentWithRetry(prompt, { 
        generationConfig: { responseMimeType: 'application/json' }
      });
      roadmapData = parseAIJSON(text);
    } catch (aiErr) {
      console.warn('Gemini API failed after all retries. Serving graceful fallback roadmap details.');
      roadmapData = {
        timeline: {
          thirtyDays: `### Phase 1: Foundations for ${targetCareer} (Days 1-30)\n- Focus on learning the baseline fundamentals and setup tools.\n- Learn Git version control and core programming principles.`,
          ninetyDays: `### Phase 2: Intermediate Deep-Dive (Days 31-90)\n- Build small-scale projects using core frameworks and libraries.\n- Study basic architecture design and data integrations.`,
          sixMonths: `### Phase 3: Advanced Portfolio & Job Search (Days 91-180)\n- Complete a comprehensive end-to-end project.\n- Re-write resume and prepare for technical screening and mock interviews.`
        },
        courses: [
          { type: "free", name: `Introduction to ${targetCareer} Skills`, provider: "Coursera", link: "https://www.coursera.org" },
          { type: "certification", name: `${targetCareer} Certification Preparation`, provider: "Udemy", link: "https://www.udemy.com" },
          { type: "youtube", name: `${targetCareer} Complete Guide`, provider: "freeCodeCamp", link: "https://www.youtube.com" }
        ],
        skillGap: {
          existingSkills: profile.skills && profile.skills.length > 0 ? profile.skills : ["General Coding", "Problem Solving"],
          missingSkills: ["Domain specific frameworks", "System Architecture", "Professional deployment"],
          prioritySkills: ["Version Control", "Core Language Framework", "Database Management"]
        }
      };
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
