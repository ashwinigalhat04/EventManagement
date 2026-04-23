const PDFDocument = require('pdfkit');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

exports.exportEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const totalRegistrations = await Registration.countDocuments({ eventId });
    const attendanceCount = await Attendance.countDocuments({ eventId, status: 'PRESENT' });
    
    const feedbacks = await Feedback.find({ eventId });
    const avgFeedback = feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;
    
    const regs = await Registration.find({ eventId });
    const revenueGenerated = regs.reduce((sum, r) => sum + r.amountPaid, 0);

    // Create PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${event.title}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(24).text(`Event Report: ${event.title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${event.date} | Time: ${event.time}`);
    doc.text(`Venue: ${event.venue}`);
    doc.moveDown();
    
    doc.fontSize(16).text('--- Analytics ---');
    doc.fontSize(14).text(`Total Registrations: ${totalRegistrations} / ${event.seatLimit}`);
    doc.text(`Attendance Percentage: ${totalRegistrations > 0 ? ((attendanceCount/totalRegistrations) * 100).toFixed(2) : 0}%`);
    doc.text(`Average Feedback Rating: ${avgFeedback} / 5 Stars`);
    doc.text(`Revenue Generated: ${revenueGenerated} INR`);
    
    doc.end();

  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF report' });
  }
};
