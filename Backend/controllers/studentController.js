const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const Feedback = require('../models/Feedback');

// ─── PUBLIC: Get All Events ───────────────────────────────────────────────────
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: -1 })
      .lean();

    for (let ev of events) {
      ev.seatsLeft = Math.max(0, ev.seatLimit - ev.seatsFilled);
      ev.isFull = ev.seatsFilled >= ev.seatLimit;
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' });
  }
};

// ─── PUBLIC: Get Single Event ─────────────────────────────────────────────────
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.seatsLeft = Math.max(0, event.seatLimit - event.seatsFilled);
    event.isFull = event.seatsFilled >= event.seatLimit;

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching event' });
  }
};

// ─── Register for Event (free or after payment) ───────────────────────────────
exports.registerForEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { name, email, mobile, year, college, section } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.seatsFilled >= event.seatLimit) {
      return res.status(400).json({ error: 'Registration closed: event is full' });
    }

    // Check already registered
    const existing = await Registration.findOne({ userId, eventId });
    if (existing) return res.status(400).json({ error: 'Already registered', registration: existing });

    // Check membership
    const membership = await Membership.findOne({ userId });
    const hasMembership = membership && membership.status === 'ACTIVE' && new Date(membership.expiryDate) > new Date();

    // Determine fee
    const amountPaid = hasMembership ? 0 : event.registrationFee;

    if (amountPaid > 0) {
      return res.status(402).json({
        error: 'Payment required',
        message: `This event costs ₹${amountPaid}. Please complete payment to register.`,
        amountDue: amountPaid,
        eventId,
      });
    }

    // Free registration
    const qrCode = `PICSEL-${eventId}-${userId}-${Date.now()}`;
    const registration = await Registration.create({
      userId, eventId,
      name, email, mobile, year, college, section,
      amountPaid: 0,
      qrCode,
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { seatsFilled: 1 } });

    res.status(201).json({ success: true, message: 'Registered successfully (free access with membership)', registration });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering for event', details: error.message });
  }
};

// ─── My Registration for an Event ────────────────────────────────────────────
exports.getMyRegistration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const reg = await Registration.findOne({ userId, eventId });
    res.json(reg || null);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching registration' });
  }
};

// ─── Membership Status ────────────────────────────────────────────────────────
exports.getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const membership = await Membership.findOne({ userId });

    // Determine if KDK CSE student
    const user = req.user;
    const isKdk = user.collegeName.toLowerCase().includes('kdk');
    const isCse = user.department === 'CSE' || user.department === 'Computer Science' || user.department.toLowerCase().includes('cse');
    const membershipRequired = isKdk && isCse;

    res.json({ membership: membership || null, membershipRequired });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching membership status' });
  }
};

// ─── Profile ──────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user.toObject();
    delete user.password;

    const membership = await Membership.findOne({ userId });
    const attendanceCount = await Attendance.countDocuments({ userId, status: 'PRESENT' });
    const registrationsCount = await Registration.countDocuments({ userId, status: 'REGISTERED' });
    const certificatesCount = await Certificate.countDocuments({ userId });

    const activityScore = (attendanceCount * 10) + (certificatesCount * 15) + (registrationsCount * 5);

    res.json({
      user,
      membership: membership || null,
      stats: { eventsAttended: attendanceCount, totalRegistrations: registrationsCount, certificates: certificatesCount, activityScore },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

// ─── My Certificates ──────────────────────────────────────────────────────────
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user._id;
    const certs = await Certificate.find({ userId })
      .populate('eventId', 'title date venue')
      .sort({ issueDate: -1 });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching certificates' });
  }
};

// ─── My Registrations (for My Passes screen) ──────────────────────────────────
exports.getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;
    const regs = await Registration.find({ userId, status: 'REGISTERED' })
      .populate('eventId', 'title date time venue status posterUrl')
      .sort({ registeredAt: -1 });
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching registrations' });
  }
};

// ─── Certificate: Check Availability and Auto-Generate ───────────────────────
exports.getCertificate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Must have attended
    const attendance = await Attendance.findOne({ userId, eventId, status: 'PRESENT' });
    if (!attendance) return res.status(400).json({ error: 'Certificate not eligible: attendance not marked' });

    // Must have submitted post-feedback
    const postFeedback = await Feedback.findOne({ userId, eventId, type: 'POST' });
    if (!postFeedback) return res.status(400).json({ error: 'Certificate not eligible: post-feedback not submitted', needsFeedback: true });

    // Check 1-hour delay
    const diffMs = new Date() - new Date(postFeedback.submittedAt);
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) {
      const minutesLeft = Math.ceil(60 - (diffMs / 60000));
      return res.status(202).json({ ready: false, message: `Certificate available in ${minutesLeft} minutes`, minutesLeft });
    }

    // Check if already generated
    let cert = await Certificate.findOne({ userId, eventId });
    if (!cert) {
      // Auto-generate
      const event = await Event.findById(eventId);
      const user = req.user;
      const certUrl = `https://picsel.in/certificates/${eventId}/${userId}.pdf`;
      cert = await Certificate.create({
        userId,
        eventId,
        certificateUrl: certUrl,
        issueDate: new Date(new Date(postFeedback.submittedAt).getTime() + 60 * 60 * 1000),
      });
    }

    await cert.populate('eventId', 'title date venue');
    res.json({ ready: true, certificate: cert });
  } catch (error) {
    console.error('Certificate error:', error);
    res.status(500).json({ error: 'Error fetching certificate' });
  }
};
