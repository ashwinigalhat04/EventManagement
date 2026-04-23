const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');

exports.generateCertificate = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    
    // Check if user attended
    const attendance = await Attendance.findOne({ userId, eventId, status: 'PRESENT' });
    if (!attendance) {
      return res.status(400).json({ error: 'User did not attend the event and is not eligible for a certificate.' });
    }

    // Check if certificate already exists
    let cert = await Certificate.findOne({ userId, eventId });
    if (cert) {
      return res.json({ message: 'Certificate already generated', certificate: cert });
    }

    // Generate mock URL
    const certificateUrl = `https://picsel.edu/certificates/${eventId}/${userId}.pdf`;

    cert = new Certificate({ userId, eventId, certificateUrl });
    await cert.save();

    res.status(201).json({ message: 'Certificate generated successfully', certificate: cert });
  } catch (error) {
    res.status(500).json({ error: 'Error generating certificate' });
  }
};

exports.bulkGenerateCertificates = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    // Find all present users
    const attendees = await Attendance.find({ eventId, status: 'PRESENT' });
    let count = 0;

    for (let record of attendees) {
      let cert = await Certificate.findOne({ userId: record.userId, eventId });
      if (!cert) {
        cert = new Certificate({
          userId: record.userId,
          eventId,
          certificateUrl: `https://picsel.edu/certificates/${eventId}/${record.userId}.pdf`
        });
        await cert.save();
        count++;
      }
    }

    res.json({ message: `${count} certificates generated in bulk` });
  } catch (error) {
    res.status(500).json({ error: 'Error generating certificates in bulk' });
  }
};

exports.getCertificatesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const certificates = await Certificate.find({ eventId }).populate('userId', 'name prn email');
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching certificates' });
  }
};
