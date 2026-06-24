const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetCareer: {
    type: String,
    required: true
  },
  timeline: {
    thirtyDays: {
      type: String, // Rich text/markdown content representing steps
      required: true
    },
    ninetyDays: {
      type: String,
      required: true
    },
    sixMonths: {
      type: String,
      required: true
    }
  },
  courses: [{
    type: {
      type: String,
      enum: ['free', 'certification', 'youtube'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: ''
    }
  }],
  skillGap: {
    existingSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    prioritySkills: [{ type: String }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
