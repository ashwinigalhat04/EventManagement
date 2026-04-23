const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  certificateUrl: { type: String },
  issueDate: { type: Date, default: Date.now }
});

certificateSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
