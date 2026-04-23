const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

exports.getAnalytics = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'STUDENT' });
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: { $in: ['UPCOMING', 'ONGOING'] } });
    
    // Calculate total revenue from registrations
    const registrations = await Registration.find();
    const totalRevenue = registrations.reduce((acc, curr) => acc + curr.amountPaid, 0);

    // Paid vs Unpaid Students (Membership logic mock - can enhance with Membership model)
    // Using a simple ratio or checking via registrations
    const paidRegistrationsCount = await Registration.countDocuments({ amountPaid: { $gt: 0 } });
    const unpaidRegistrationsCount = registrations.length - paidRegistrationsCount;

    // Seat utilization stats
    const events = await Event.find();
    const seatUtilization = events.map(ev => ({
      eventId: ev._id,
      title: ev.title,
      utilizationPercentage: ev.seatLimit > 0 ? ((ev.seatsFilled / ev.seatLimit) * 100).toFixed(2) : 0
    }));

    res.json({
      totalMembers,
      totalEvents,
      activeEvents,
      totalRevenue,
      paidVsUnpaid: {
        paid: paidRegistrationsCount,
        unpaid: unpaidRegistrationsCount
      },
      seatUtilization
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving analytics' });
  }
};
