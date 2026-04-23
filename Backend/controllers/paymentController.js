const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── MEMBERSHIP PAYMENT ──────────────────────────────────────────────────────

exports.createMembershipOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const amount = 499; // ₹499 in rupees

    const rzp = getRazorpay();
    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: `receipt_mem_${userId.toString().substring(0, 8)}`,
    };

    const order = await rzp.orders.create(options);

    await Payment.create({
      userId,
      type: 'MEMBERSHIP',
      amount: amount * 100,
      currency: 'INR',
      status: 'CREATED',
      razorpayOrderId: order.id,
    });

    return res.json({
      bypass: false,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create membership order error:', error);
    res.status(500).json({ error: 'Error creating payment order', details: error.message });
  }
};

exports.verifyMembershipPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' });
    }

    // Update Payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'PAID', paidAt: new Date() }
    );

    // Generate Membership ID
    const count = await Membership.countDocuments();
    const membershipId = `PICSEL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Upsert Membership
    const membership = await Membership.findOneAndUpdate(
      { userId },
      {
        userId,
        membershipId,
        status: 'ACTIVE',
        feePaid: true,
        amount: 499,
        yearValid: String(new Date().getFullYear()),
        expiryDate,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Membership activated successfully', membership });
  } catch (error) {
    console.error('Verify membership payment error:', error);
    res.status(500).json({ error: 'Error verifying payment', details: error.message });
  }
};

// ─── EVENT PAYMENT ────────────────────────────────────────────────────────────

exports.createEventOrder = async (req, res) => {
  try {
    const { eventId, formData } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const amount = event.registrationFee; // rupees
    if (amount <= 0) return res.status(400).json({ error: 'This event is free, no payment needed' });

    const rzp = getRazorpay();
    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_evt_${eventId.toString().substring(0, 4)}_${userId.toString().substring(0, 4)}`,
    };

    const order = await rzp.orders.create(options);

    await Payment.create({
      userId,
      type: 'EVENT',
      referenceId: eventId,
      amount: amount * 100,
      currency: 'INR',
      status: 'CREATED',
      razorpayOrderId: order.id,
    });

    return res.json({
      bypass: false,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create event order error:', error);
    res.status(500).json({ error: 'Error creating event payment order', details: error.message });
  }
};

exports.verifyEventPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, formData } = req.body;
    const userId = req.user._id;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' });
    }

    // Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'PAID', paidAt: new Date() },
      { new: true }
    );

    // Create Registration
    const qrCode = `PICSEL-${eventId}-${userId}-${Date.now()}`;
    const event = await Event.findById(eventId);

    let registration = await Registration.findOne({ userId, eventId });
    if (!registration) {
      registration = await Registration.create({
        userId, eventId,
        name: formData.name, email: formData.email,
        mobile: formData.mobile, year: formData.year,
        college: formData.college, section: formData.section,
        amountPaid: payment ? payment.amount / 100 : 0,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        qrCode,
      });
      // Increment seats filled
      await Event.findByIdAndUpdate(eventId, { $inc: { seatsFilled: 1 } });
    }

    res.json({ success: true, message: 'Registration successful after payment', registration });
  } catch (error) {
    console.error('Verify event payment error:', error);
    res.status(500).json({ error: 'Error verifying event payment', details: error.message });
  }
};

// ─── PAYMENT CHECKOUT HTML PAGE (for WebView/expo-web-browser) ───────────────

exports.paymentCheckoutPage = (req, res) => {
  const { orderId, amount, keyId, name, description, prefill_name, prefill_email, prefill_contact, callbackScheme } = req.query;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>PICSEL Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0F172A; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; color: white; }
    .logo { font-size: 28px; font-weight: 900; color: #8B5CF6; margin-bottom: 8px; letter-spacing: 2px; }
    .subtitle { font-size: 14px; color: #94A3B8; margin-bottom: 32px; }
    .card { background: #1E293B; border-radius: 20px; padding: 32px; width: 90%; max-width: 380px; border: 1px solid #334155; text-align: center; }
    .amount { font-size: 42px; font-weight: 900; color: #F8FAFC; margin-bottom: 8px; }
    .desc { color: #94A3B8; font-size: 14px; margin-bottom: 28px; }
    .btn { background: #8B5CF6; color: white; border: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; }
    .btn:active { opacity: 0.8; }
    .secure { color: #475569; font-size: 12px; margin-top: 16px; }
    .spinner { display: none; margin: 20px auto; border: 3px solid #334155; border-top: 3px solid #8B5CF6; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="logo">PICSEL</div>
  <div class="subtitle">Secure Payment Gateway</div>
  <div class="card">
    <div class="amount">₹${Math.round(parseInt(amount || '0') / 100)}</div>
    <div class="desc">${description || 'PICSEL Membership'}</div>
    <button class="btn" onclick="startPayment()">Pay Now</button>
    <div class="spinner" id="spinner"></div>
    <div class="secure">🔒 Secured by Razorpay</div>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function startPayment() {
      document.querySelector('.btn').style.display = 'none';
      document.getElementById('spinner').style.display = 'block';
      var options = {
        key: '${keyId}',
        amount: '${amount}',
        currency: 'INR',
        name: 'PICSEL',
        description: '${description || 'Membership'}',
        order_id: '${orderId}',
        prefill: { name: '${prefill_name || ''}', email: '${prefill_email || ''}', contact: '${prefill_contact || ''}' },
        theme: { color: '#8B5CF6' },
        handler: function(response) {
          var scheme = '${callbackScheme || 'campluse'}';
          var url = scheme + '://payment-success?paymentId=' + response.razorpay_payment_id + '&orderId=' + response.razorpay_order_id + '&signature=' + response.razorpay_signature;
          window.location.href = url;
        },
        modal: { ondismiss: function() { window.location.href = '${callbackScheme || 'campluse'}://payment-failed'; } }
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        window.location.href = '${callbackScheme || 'campluse'}://payment-failed?error=' + response.error.description;
      });
      rzp.open();
    }
    // Auto-open on load
    window.onload = function() { setTimeout(startPayment, 500); };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
