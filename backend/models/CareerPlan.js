const mongoose = require('mongoose');

const CareerPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendations: [{
    title: {
      type: String,
      required: true
    },
    suitabilityReason: {
      type: String,
      required: true
    },
    salaryRange: {
      type: String,
      required: true
    },
    growthOpportunities: {
      type: String,
      required: true
    },
    priority: {
      type: Number,
      default: 1
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CareerPlan', CareerPlanSchema);
