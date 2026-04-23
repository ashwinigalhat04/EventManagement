const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['MEMBERSHIP', 'EVENT'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // eventId for EVENT, null/userId for MEMBERSHIP

  // Razorpay
  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  amount:   { type: Number, required: true }, // in paise
  currency: { type: String, default: 'INR' },
  status:   { type: String, enum: ['CREATED', 'PAID', 'FAILED'], default: 'CREATED' },

  createdAt: { type: Date, default: Date.now },
  paidAt:    { type: Date }
});

module.exports = mongoose.model('Payment', paymentSchema);
