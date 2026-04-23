const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['REGISTERED', 'CANCELLED'], default: 'REGISTERED' },
  amountPaid: { type: Number, default: 0 },
  qrCode: { type: String }, // Random string for QR
  registeredAt: { type: Date, default: Date.now }
});

// Ensure one registration per user per event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
