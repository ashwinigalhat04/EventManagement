const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  membershipId:      { type: String, unique: true, sparse: true }, // e.g. PICSEL-2026-0001
  status:            { type: String, enum: ['ACTIVE', 'INACTIVE', 'PENDING'], default: 'INACTIVE' },
  feePaid:           { type: Boolean, default: false },
  amount:            { type: Number, default: 499 },
  yearValid:         { type: String },
  expiryDate:        { type: Date },
  // Razorpay fields
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  // Receipt metadata
  paidAt:            { type: Date },
  updatedAt:         { type: Date, default: Date.now }
});

module.exports = mongoose.model('Membership', membershipSchema);
