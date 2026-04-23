const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(400).json({ error: 'Error creating event', details: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(400).json({ error: 'Error updating event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    // Also delete associated registrations etc.
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting event' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().lean();
    
    // Attach extra metadata
    for (let ev of events) {
      ev.totalRegistrations = await Registration.countDocuments({ eventId: ev._id });
      ev.attendanceCount = await Attendance.countDocuments({ eventId: ev._id, status: 'PRESENT' });
      
      const feedbacks = await Feedback.find({ eventId: ev._id });
      const avgFeedback = feedbacks.length > 0 
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0;
      
      ev.averageFeedback = avgFeedback;

      const regs = await Registration.find({ eventId: ev._id });
      ev.revenueGenerated = regs.reduce((sum, r) => sum + r.amountPaid, 0);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' });
  }
};
