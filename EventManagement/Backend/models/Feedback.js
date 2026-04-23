const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

feedbackSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
