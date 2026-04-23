const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type:    { type: String, enum: ['PRE', 'POST'], required: true },

  // PRE-feedback fields
  expectations: { type: String },
  hearAbout:    { type: String },

  // POST-feedback fields
  rating:  { type: Number, min: 1, max: 5 },
  comment: { type: String },

  submittedAt: { type: Date, default: Date.now }
});

// One pre-feedback AND one post-feedback per user per event
feedbackSchema.index({ userId: 1, eventId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
