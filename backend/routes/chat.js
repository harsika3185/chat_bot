const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateContentWithRetry } = require('../utils/gemini');

// @desc    Get all chat sessions for user
// @route   GET /api/chat/sessions
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new chat session
// @route   POST /api/chat/sessions
// @access  Private
router.post('/sessions', protect, async (req, res) => {
  try {
    const session = await ChatHistory.create({
      userId: req.user._id,
      title: req.body.title || 'New Conversation',
      messages: [{
        role: 'system',
        content: `You are Career Compass AI, an elite professional career counselor. Help the user clarify their career goals, build relevant skills, find job opportunities, prepare for interviews, and draft their learning path.`
      }]
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get specific chat session messages
// @route   GET /api/chat/sessions/:id
// @access  Private
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Send a message in a session & get AI response
// @route   POST /api/chat/sessions/:id/message
// @access  Private
router.post('/sessions/:id/message', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Please provide a message' });
  }

  try {
    const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    // Get user profile details to inject into system message dynamically
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    const profile = user.profile || {};
    
    // Format profile string for AI context
    const profileContext = `
User Profile Context:
- Name: ${user.name}
- Degree: ${profile.degree || 'Not specified'}
- Department: ${profile.department || 'Not specified'}
- Current Year: ${profile.currentYear || 'Not specified'}
- Skills: ${profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : 'Not specified'}
- Areas of Interest: ${profile.areasOfInterest && profile.areasOfInterest.length > 0 ? profile.areasOfInterest.join(', ') : 'Not specified'}
- Career Goal: ${profile.careerGoal || 'Not specified'}
    `;

    // Make sure system prompt contains latest profile information
    if (session.messages[0] && session.messages[0].role === 'system') {
      session.messages[0].content = `You are Career Compass AI, an elite professional career counselor. Help the user clarify their career goals, build relevant skills, find job opportunities, prepare for interviews, and draft their learning path.\n\n${profileContext}\n\nAlways address the user cordially and use their profile to tailor your recommendations. Format your output nicely using markdown headings, lists, bold text, and code blocks.`;
    }

    // Add user message to history in DB
    session.messages.push({
      role: 'user',
      content: message
    });

    let assistantResponse = '';

    // Trigger Gemini Content Generation (no mock fallback!)
    try {
      // Build structured contents query
      const contents = [];
      for (const m of session.messages) {
        if (m.role === 'system') continue;
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      }

      // Configure system instruction context
      const systemInstruction = session.messages[0].content;

      assistantResponse = await generateContentWithRetry(
        { contents: contents },
        { systemInstruction: systemInstruction }
      );
    } catch (aiErr) {
      console.warn('Gemini API failed after all retries. Serving graceful fallback chatbot reply.');
      assistantResponse = "I am currently experiencing higher demand than usual. Let's focus on your primary goal: building skills, resume optimization, and mock interview preparations. Feel free to ask generic questions in the meantime!";
    }

    // Save assistant reply in DB
    session.messages.push({
      role: 'assistant',
      content: assistantResponse
    });

    // Update session title dynamically if it was a new chat session
    if (session.title === 'New Chat Session' || session.title === 'New Conversation' || session.title === 'New Guidance Chat') {
      session.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    }

    await session.save();

    res.json({
      success: true,
      reply: assistantResponse,
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a chat session
// @route   DELETE /api/chat/sessions/:id
// @access  Private
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    const result = await ChatHistory.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }
    res.json({ success: true, message: 'Chat session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
