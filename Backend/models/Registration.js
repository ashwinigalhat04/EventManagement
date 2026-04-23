const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

  // Registration form details (collected at time of registration)
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  mobile:   { type: String, required: true },
  year:     { type: String, required: true },
  college:  { type: String, required: true },
  section:  { type: String, required: true },

  status:   { type: String, enum: ['REGISTERED', 'CANCELLED'], default: 'REGISTERED' },
  amountPaid: { type: Number, default: 0 },

  // Razorpay
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },

  // QR and feedback-flow
  qrCode:               { type: String }, // unique token for entry pass
  preFeedbackSubmitted: { type: Boolean, default: false },
  qrUnlocked:           { type: Boolean, default: false }, // true after pre-feedback

  registeredAt: { type: Date, default: Date.now }
});

// One registration per user per event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
