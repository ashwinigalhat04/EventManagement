const PDFDocument = require('pdfkit');
const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');
const Membership = require('../models/Membership');

exports.exportEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const totalRegs = await Registration.countDocuments({ eventId });
    const attendanceCount = await Attendance.countDocuments({ eventId, status: 'PRESENT' });
    const feedbacks = await Feedback.find({ eventId, type: 'POST' });
    const avgFeedback = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : 0;
    const regs = await Registration.find({ eventId });
    const revenue = regs.reduce((s, r) => s + (r.amountPaid || 0), 0);
    const certCount = await Certificate.countDocuments({ eventId });
    const attendancePct = totalRegs > 0 ? ((attendanceCount / totalRegs) * 100).toFixed(1) : 0;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${event.title}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#1E1B4B');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('PICSEL ERP', 50, 20);
    doc.fillColor('#818CF8').fontSize(12).text('Smart CSE Membership & Event Management', 50, 48);
    doc.fillColor('#000000').moveDown(3);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1E1B4B')
       .text(`Event Report: ${event.title}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#334155');
    doc.moveDown(0.5);

    // Event Details
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#334155').text('EVENT DETAILS');
    doc.moveDown(0.3);
    const details = [
      ['Date', event.date], ['Time', event.time], ['Venue', event.venue],
      ['Seat Limit', String(event.seatLimit)], ['Status', event.status],
    ];
    details.forEach(([label, val]) => {
      doc.fontSize(11).font('Helvetica').fillColor('#475569').text(`${label}: `, { continued: true });
      doc.fillColor('#111827').text(val || 'N/A');
    });
    doc.moveDown(0.8);

    // Analytics
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#E2E8F0');
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#334155').text('ANALYTICS SUMMARY');
    doc.moveDown(0.3);

    const rows = [
      ['Total Registrations', `${totalRegs} / ${event.seatLimit}`],
      ['Attendance (Present)', `${attendanceCount} (${attendancePct}%)`],
      ['Average Feedback Rating', `${avgFeedback} / 5 ⭐`],
      ['Certificates Generated', String(certCount)],
      ['Revenue Generated', `₹${revenue}`],
      ['Seat Utilization', `${event.seatLimit > 0 ? ((event.seatsFilled / event.seatLimit) * 100).toFixed(1) : 0}%`],
    ];
    rows.forEach(([label, val], i) => {
      doc.rect(50, doc.y, doc.page.width - 100, 22).fill(i % 2 === 0 ? '#F8FAFC' : '#FFFFFF').stroke('#E2E8F0');
      doc.fontSize(11).font('Helvetica').fillColor('#374151').text(label, 60, doc.y - 16, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#111827').text(val, { align: 'right' });
    });
    doc.moveDown(1);

    // Registrant List
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#E2E8F0');
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#334155').text('REGISTRANT LIST');
    doc.moveDown(0.3);

    const allRegs = await Registration.find({ eventId }).lean();
    const headers = ['Name', 'Email', 'Year', 'Section', 'Amt Paid'];
    const colWidths = [130, 170, 50, 50, 70];
    let x = 50;
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#1E1B4B');
    headers.forEach((h, i) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF').text(h, x + 4, doc.y - 14, { width: colWidths[i] });
      x += colWidths[i];
    });
    doc.moveDown(0.3);

    allRegs.forEach((r, idx) => {
      const att = null; // would need await
      doc.rect(50, doc.y, doc.page.width - 100, 18).fill(idx % 2 === 0 ? '#F1F5F9' : '#FFFFFF').stroke('#E2E8F0');
      let cx = 50;
      const cells = [r.name, r.email, r.year, r.section, `₹${r.amountPaid || 0}`];
      cells.forEach((cell, i) => {
        doc.fontSize(8).font('Helvetica').fillColor('#374151').text(String(cell || ''), cx + 4, doc.y - 12, { width: colWidths[i], ellipsis: true });
        cx += colWidths[i];
      });
      doc.moveDown(0.2);
    });

    doc.moveDown(1);
    doc.fontSize(9).fillColor('#9CA3AF').font('Helvetica')
       .text(`Generated by PICSEL ERP on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Report error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error generating PDF report' });
  }
};

exports.exportMembershipReport = async (req, res) => {
  try {
    const members = await User.find({ role: 'STUDENT' }).select('-password').lean();
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="membership-report.pdf"');
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 80).fill('#1E1B4B');
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('PICSEL ERP', 50, 20);
    doc.fillColor('#818CF8').fontSize(12).text('Membership Report', 50, 48);
    doc.fillColor('#000000').moveDown(3);

    let active = 0, inactive = 0;
    for (const m of members) {
      const mem = await Membership.findOne({ userId: m._id });
      if (mem && mem.status === 'ACTIVE') active++;
      else inactive++;
    }

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1E1B4B').text('Membership Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#374151').text(`Total Students: ${members.length}  |  Active: ${active}  |  Inactive: ${inactive}`, { align: 'center' });
    doc.moveDown(1);

    const headers = ['Name', 'Email', 'Year', 'Membership', 'Status', 'Expiry'];
    const colWidths = [120, 150, 40, 90, 60, 80];
    let x = 50;
    doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#1E1B4B');
    headers.forEach((h, i) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF').text(h, x + 4, doc.y - 14, { width: colWidths[i] });
      x += colWidths[i];
    });
    doc.moveDown(0.3);

    for (let idx = 0; idx < members.length; idx++) {
      const m = members[idx];
      const mem = await Membership.findOne({ userId: m._id });
      doc.rect(50, doc.y, doc.page.width - 100, 18).fill(idx % 2 === 0 ? '#F1F5F9' : '#FFFFFF').stroke('#E2E8F0');
      let cx = 50;
      const cells = [
        m.name, m.email, m.year,
        mem?.membershipId || 'N/A',
        mem?.status || 'INACTIVE',
        mem?.expiryDate ? new Date(mem.expiryDate).toLocaleDateString('en-IN') : 'N/A'
      ];
      cells.forEach((cell, i) => {
        doc.fontSize(8).font('Helvetica').fillColor('#374151').text(String(cell), cx + 4, doc.y - 12, { width: colWidths[i], ellipsis: true });
        cx += colWidths[i];
      });
      doc.moveDown(0.2);
    }

    doc.moveDown(1);
    doc.fontSize(9).fillColor('#9CA3AF').text(`Generated by PICSEL ERP on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: 'Error generating membership report' });
  }
};
