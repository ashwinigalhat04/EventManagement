const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');

exports.markAttendance = async (req, res) => {
  try {
    const { userId, eventId, status } = req.body;
    
    // Verify user is registered
    const isRegistered = await Registration.findOne({ userId, eventId });
    if (!isRegistered) {
      return res.status(400).json({ error: 'User is not registered for this event.' });
    }

    let attendance = await Attendance.findOne({ userId, eventId });
    if (attendance) {
      attendance.status = status || 'PRESENT';
      attendance.markedAt = Date.now();
      await attendance.save();
    } else {
      attendance = new Attendance({ userId, eventId, status: status || 'PRESENT' });
      await attendance.save();
    }

    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Error marking attendance' });
  }
};

exports.getAttendanceByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendance = await Attendance.find({ eventId }).populate('userId', 'name email prn');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
};
