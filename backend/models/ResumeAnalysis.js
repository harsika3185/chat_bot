const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  atsScore: {
    type: Number,
    required: true
  },
  missingSkills: [{
    type: String
  }],
  suggestions: [{
    type: String
  }],
  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
