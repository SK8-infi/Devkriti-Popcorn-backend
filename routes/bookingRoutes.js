import express from 'express';
import { createBooking, getOccupiedSeats, handlePaymentFailure, handleStripeWebhook, checkPaymentStatus, forceUpdatePaymentStatus, getMyBookings, retryPayment, testWebhook, webhookTest, testPaymentConfirmation, checkStripeConfig, listAllBookings } from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const bookingRouter = express.Router();

bookingRouter.post('/create', authenticateToken, createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);
bookingRouter.post('/payment-failed', handlePaymentFailure);
bookingRouter.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
bookingRouter.post('/webhook-test', webhookTest); // Simple webhook test
bookingRouter.post('/test-webhook', testWebhook); // Test endpoint for manual webhook testing
bookingRouter.post('/test-payment-confirmation', testPaymentConfirmation); // Test payment confirmation
bookingRouter.get('/check-stripe-config', checkStripeConfig); // Check Stripe configuration
bookingRouter.get('/list-all-bookings', listAllBookings); // List all bookings for testing
bookingRouter.get('/payment-status/:bookingId', checkPaymentStatus);
bookingRouter.put('/payment-status/:bookingId', forceUpdatePaymentStatus);
bookingRouter.get('/my-bookings', authenticateToken, getMyBookings);
bookingRouter.post('/retry-payment/:bookingId', authenticateToken, retryPayment);

export default bookingRouter;