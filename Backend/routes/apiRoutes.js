const express = require('express');
const router = express.Router();

// Controllers
const dashboardController = require('../controllers/dashboardController');
const eventController = require('../controllers/eventController');
const membershipController = require('../controllers/membershipController');
const attendanceController = require('../controllers/attendanceController');
const certificateController = require('../controllers/certificateController');
const reportController = require('../controllers/reportController');
const paymentController = require('../controllers/paymentController');
const feedbackController = require('../controllers/feedbackController');
const studentController = require('../controllers/studentController');

// Middleware
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES (no auth required)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/events', studentController.getEvents);
router.get('/events/:id', studentController.getEventById);

// Payment checkout page (served as HTML for expo-web-browser)
router.get('/payment/checkout', paymentController.paymentCheckoutPage);

// ═══════════════════════════════════════════════════════════════════════════
//  AUTHENTICATED STUDENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Membership
router.get('/membership/status', authMiddleware, studentController.getMembershipStatus);
router.post('/membership/create-order', authMiddleware, paymentController.createMembershipOrder);
router.post('/membership/verify-payment', authMiddleware, paymentController.verifyMembershipPayment);

// Event Registration
router.post('/events/:eventId/register', authMiddleware, studentController.registerForEvent);
router.get('/events/:eventId/my-registration', authMiddleware, studentController.getMyRegistration);

// Event Payment (when membership is not active)
router.post('/event-payment/create-order', authMiddleware, paymentController.createEventOrder);
router.post('/event-payment/verify-payment', authMiddleware, paymentController.verifyEventPayment);

// Feedback
router.post('/events/:eventId/pre-feedback', authMiddleware, feedbackController.submitPreFeedback);
router.post('/events/:eventId/post-feedback', authMiddleware, feedbackController.submitPostFeedback);
router.get('/events/:eventId/my-feedback', authMiddleware, feedbackController.getMyFeedback);

// Certificate
router.get('/events/:eventId/certificate', authMiddleware, studentController.getCertificate);

// Profile
router.get('/profile', authMiddleware, studentController.getProfile);
router.get('/profile/certificates', authMiddleware, studentController.getMyCertificates);
router.get('/profile/my-passes', authMiddleware, studentController.getMyRegistrations);

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Dashboard Analytics
router.get('/admin/analytics', adminMiddleware, dashboardController.getAnalytics);

// Event Management
router.post('/admin/events', adminMiddleware, eventController.createEvent);
router.put('/admin/events/:id', adminMiddleware, eventController.updateEvent);
router.delete('/admin/events/:id', adminMiddleware, eventController.deleteEvent);
router.get('/admin/events', adminMiddleware, eventController.getAllEvents);

// Membership Management
router.get('/admin/students', adminMiddleware, membershipController.getAllStudents);
router.post('/admin/membership/update', adminMiddleware, membershipController.updateMembershipFee);

// Attendance Management
router.post('/admin/attendance/mark', adminMiddleware, attendanceController.markAttendance);
router.get('/admin/attendance/:eventId', adminMiddleware, attendanceController.getAttendanceByEvent);

// Certificate Management
router.post('/admin/certificates/generate', adminMiddleware, certificateController.generateCertificate);
router.post('/admin/certificates/bulk', adminMiddleware, certificateController.bulkGenerateCertificates);
router.get('/admin/certificates/:eventId', adminMiddleware, certificateController.getCertificatesByEvent);

// Feedback (Admin view)
router.get('/admin/events/:eventId/feedback', adminMiddleware, feedbackController.getEventFeedbackAdmin);

// Reports
router.get('/admin/reports/event/:eventId/pdf', adminMiddleware, reportController.exportEventReport);
router.get('/admin/reports/membership/pdf', adminMiddleware, reportController.exportMembershipReport);

module.exports = router;
