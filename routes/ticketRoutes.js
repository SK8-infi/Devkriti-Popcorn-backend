import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { downloadTicket, resendTicketEmail, getTicketQRCode, testTicketAPI } from '../controllers/ticketController.js';

const ticketRouter = express.Router();

// Download ticket PDF
ticketRouter.get('/download/:bookingId', authenticateToken, downloadTicket);

// Resend ticket email
ticketRouter.post('/resend-email/:bookingId', authenticateToken, resendTicketEmail);

// Get ticket QR code data
ticketRouter.get('/qr-code/:bookingId', authenticateToken, getTicketQRCode);

// Test endpoint
ticketRouter.get('/test', authenticateToken, testTicketAPI);

export default ticketRouter; 