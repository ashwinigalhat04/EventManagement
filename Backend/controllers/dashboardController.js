const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

exports.getAnalytics = async (req, res) => {
  try {
    // Core counts
    const totalMembers = await User.countDocuments({ role: 'STUDENT' });
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['UPCOMING', 'ONGOING'] } });
    const completedEvents = await Event.countDocuments({ status: 'COMPLETED' });

    // Revenue from registrations
    const regs = await Registration.find({ status: 'REGISTERED' });
    const totalRevenue = regs.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    // Revenue from memberships
    const paidMemberships = await Membership.find({ feePaid: true });
    const membershipRevenue = paidMemberships.reduce((sum, m) => sum + (m.amount || 0), 0);
    const grandTotalRevenue = totalRevenue + membershipRevenue;

    // Paid vs Unpaid Students (Membership)
    const paidCount = await Membership.countDocuments({ status: 'ACTIVE' });
    const unpaidCount = totalMembers - paidCount;

    // Year-wise Revenue
    const students = await User.find({ role: 'STUDENT' }).lean();
    const yearWiseRevenue = {};
    for (const student of students) {
      const membership = await Membership.findOne({ userId: student._id, feePaid: true });
      const evtRegs = await Registration.find({ userId: student._id });
      const evtRev = evtRegs.reduce((s, r) => s + (r.amountPaid || 0), 0);
      const memRev = membership ? (membership.amount || 0) : 0;
      const yr = student.year || 'Unknown';
      yearWiseRevenue[yr] = (yearWiseRevenue[yr] || 0) + evtRev + memRev;
    }

    // Most Active Year (by registrations)
    const yearActivity = {};
    for (const reg of regs) {
      const user = students.find(s => String(s._id) === String(reg.userId));
      const yr = user ? user.year : 'Unknown';
      yearActivity[yr] = (yearActivity[yr] || 0) + 1;
    }
    const mostActiveYear = Object.entries(yearActivity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Events with registration data
    const events = await Event.find().lean();
    let mostSuccessfulEvent = null;
    let maxAttendance = 0;

    const seatUtilization = [];
    for (const ev of events) {
      const attendeeCount = await Attendance.countDocuments({ eventId: ev._id, status: 'PRESENT' });
      const regCount = await Registration.countDocuments({ eventId: ev._id });
      const feedbacks = await Feedback.find({ eventId: ev._id, type: 'POST' });
      const avgRating = feedbacks.length > 0
        ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0;

      if (attendeeCount > maxAttendance) {
        maxAttendance = attendeeCount;
        mostSuccessfulEvent = { title: ev.title, attendees: attendeeCount, avgRating };
      }

      seatUtilization.push({
        title: ev.title,
        seatLimit: ev.seatLimit,
        seatsFilled: ev.seatsFilled,
        utilizationPct: ev.seatLimit > 0 ? ((ev.seatsFilled / ev.seatLimit) * 100).toFixed(1) : '0',
        registrations: regCount,
        attendance: attendeeCount,
        avgRating,
      });
    }

    res.json({
      totalMembers,
      totalEvents,
      activeEvents,
      completedEvents,
      totalRevenue: grandTotalRevenue,
      membershipRevenue,
      eventRevenue: totalRevenue,
      paidVsUnpaid: { paid: paidCount, unpaid: unpaidCount },
      yearWiseRevenue,
      mostActiveYear,
      mostSuccessfulEvent,
      seatUtilization,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error retrieving analytics' });
  }
};
