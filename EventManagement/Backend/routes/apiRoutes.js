const express = require('express');
const router = express.Router();

// Import controllers
const dashboardController = require('../controllers/dashboardController');
const eventController = require('../controllers/eventController');
const membershipController = require('../controllers/membershipController');
const attendanceController = require('../controllers/attendanceController');
const certificateController = require('../controllers/certificateController');
const reportController = require('../controllers/reportController');

// Import Middleware
const adminMiddleware = require('../middleware/adminMiddleware');

// === ADMIN ROUTES ===

// 1. Analytics & Dashboard
router.get('/admin/analytics', adminMiddleware, dashboardController.getAnalytics);

// 2. Event Management
router.post('/admin/events', adminMiddleware, eventController.createEvent);
router.put('/admin/events/:id', adminMiddleware, eventController.updateEvent);
router.delete('/admin/events/:id', adminMiddleware, eventController.deleteEvent);
router.get('/admin/events', adminMiddleware, eventController.getAllEvents);

// 3. Membership Management
router.get('/admin/students', adminMiddleware, membershipController.getAllStudents);
router.post('/admin/membership/update', adminMiddleware, membershipController.updateMembershipFee);

// 4. Attendance Management
router.post('/admin/attendance/mark', adminMiddleware, attendanceController.markAttendance);
router.get('/admin/attendance/:eventId', adminMiddleware, attendanceController.getAttendanceByEvent);

// 5. Certificate Management
router.post('/admin/certificates/generate', adminMiddleware, certificateController.generateCertificate);
router.post('/admin/certificates/bulk', adminMiddleware, certificateController.bulkGenerateCertificates);
router.get('/admin/certificates/:eventId', adminMiddleware, certificateController.getCertificatesByEvent);

// 6. Reports & PDF Export
router.get('/admin/reports/event/:eventId/pdf', adminMiddleware, reportController.exportEventReport);

module.exports = router;
