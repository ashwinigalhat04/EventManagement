const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Certificate = require('../models/Certificate');

// ─── PRE-EVENT FEEDBACK ───────────────────────────────────────────────────────

exports.submitPreFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { expectations, hearAbout } = req.body;

    // Must be registered
    const registration = await Registration.findOne({ userId, eventId, status: 'REGISTERED' });
    if (!registration) return res.status(400).json({ error: 'You are not registered for this event' });

    // Check if already submitted
    const existing = await Feedback.findOne({ userId, eventId, type: 'PRE' });
    if (existing) return res.status(400).json({ error: 'Pre-feedback already submitted', alreadySubmitted: true });

    if (!expectations || expectations.trim().length < 5) {
      return res.status(400).json({ error: 'Please share your expectations (min 5 characters)' });
    }

    const feedback = await Feedback.create({ userId, eventId, type: 'PRE', expectations, hearAbout });

    // Unlock QR after pre-feedback
    await Registration.findOneAndUpdate(
      { userId, eventId },
      { preFeedbackSubmitted: true, qrUnlocked: true }
    );

    res.status(201).json({ success: true, message: 'Pre-feedback submitted! Your QR pass is now unlocked.', feedback });
  } catch (error) {
    console.error('Pre-feedback error:', error);
    res.status(500).json({ error: 'Error submitting pre-feedback' });
  }
};

// ─── POST-EVENT FEEDBACK ──────────────────────────────────────────────────────

exports.submitPostFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    // Must be registered
    const registration = await Registration.findOne({ userId, eventId, status: 'REGISTERED' });
    if (!registration) return res.status(400).json({ error: 'You are not registered for this event' });

    // Must have attended
    const attendance = await Attendance.findOne({ userId, eventId, status: 'PRESENT' });
    if (!attendance) return res.status(400).json({ error: 'Attendance not marked. Post-feedback requires attendance.' });

    // Check event is COMPLETED
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Post-feedback is only available after event completion' });
    }

    // 2-day window check — completedAt stored in event or use event date
    const completedTime = event.completedAt || new Date(event.date);
    const now = new Date();
    const diffMs = now - completedTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 48) {
      return res.status(400).json({ error: 'Post-feedback window has expired (2-day limit)', expired: true });
    }

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a rating between 1 and 5' });
    }

    // Check already submitted
    const existing = await Feedback.findOne({ userId, eventId, type: 'POST' });
    if (existing) return res.status(400).json({ error: 'Post-feedback already submitted', alreadySubmitted: true });

    const feedback = await Feedback.create({ userId, eventId, type: 'POST', rating, comment });

    // Certificate will be auto-generated after 1 hour (checked on GET)
    res.status(201).json({
      success: true,
      message: 'Post-feedback submitted! Your certificate will be available in 1 hour.',
      feedback,
    });
  } catch (error) {
    console.error('Post-feedback error:', error);
    res.status(500).json({ error: 'Error submitting post-feedback' });
  }
};

// ─── GET MY FEEDBACK (for a specific event) ───────────────────────────────────

exports.getMyFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const preFeedback = await Feedback.findOne({ userId, eventId, type: 'PRE' });
    const postFeedback = await Feedback.findOne({ userId, eventId, type: 'POST' });

    res.json({ preFeedback, postFeedback });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching feedback' });
  }
};

// ─── ADMIN: Get All Feedback For Event ───────────────────────────────────────

exports.getEventFeedbackAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type } = req.query; // PRE or POST

    const filter = { eventId };
    if (type) filter.type = type;

    const feedbacks = await Feedback.find(filter).populate('userId', 'name email year section');
    const avgRating = feedbacks.filter(f => f.type === 'POST').length > 0
      ? (feedbacks.filter(f => f.type === 'POST').reduce((s, f) => s + f.rating, 0) / feedbacks.filter(f => f.type === 'POST').length).toFixed(1)
      : null;

    res.json({ feedbacks, totalPre: feedbacks.filter(f => f.type === 'PRE').length, totalPost: feedbacks.filter(f => f.type === 'POST').length, avgRating });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching feedback' });
  }
};
