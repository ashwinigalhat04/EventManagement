const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'INACTIVE' },
  feePaid: { type: Boolean, default: false },
  amount: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  yearValid: { type: String, required: true },
  expiryDate: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Membership', membershipSchema);
