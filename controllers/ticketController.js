import Booking from '../models/Booking.js';
import { generateTicket } from '../utils/ticketGenerator.js';
import { sendTicketEmail } from '../utils/emailService.js';

// Download ticket PDF
export const downloadTicket = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        console.log(`Attempting to download ticket for booking: ${bookingId}, user: ${userId}`);

        // Find booking and verify ownership
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' }
                ]
            })
            .populate('user');

        console.log(`Booking found:`, booking ? 'Yes' : 'No');
        if (booking) {
            console.log(`Booking isPaid: ${booking.isPaid}, user: ${booking.user._id}`);
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking is paid
        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot download ticket for unpaid booking'
            });
        }

        // Generate ticket
        const ticket = await generateTicket(booking);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${bookingId}.pdf"`);
        res.setHeader('Content-Length', ticket.pdfBuffer.length);

        // Send PDF buffer
        res.send(ticket.pdfBuffer);

    } catch (error) {
        console.error('Error downloading ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download ticket',
            error: error.message
        });
    }
};

// Resend ticket email
export const resendTicketEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        console.log(`Attempting to resend ticket email for booking: ${bookingId}, user: ${userId}`);

        // Find booking and verify ownership
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' },

                ]
            })
            .populate('user');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking is paid
        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot resend ticket for unpaid booking'
            });
        }

        // Send ticket email
        const result = await sendTicketEmail(bookingId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Ticket email sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send ticket email',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error resending ticket email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend ticket email',
            error: error.message
        });
    }
};

// Get ticket QR code data
export const getTicketQRCode = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        console.log(`Attempting to get QR code for booking: ${bookingId}, user: ${userId}`);

        // Find booking and verify ownership
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' },

                ]
            })
            .populate('user');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking is paid
        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot get QR code for unpaid booking'
            });
        }

        // Generate QR code data
        const qrData = {
            bookingId: booking._id,
            movieTitle: booking.show?.movie?.title,
            theatreName: booking.show?.theatre?.name,
            showDate: booking.show?.showDateTime,
            showTime: booking.show?.showDateTime,
            seats: booking.bookedSeats,
            userId: booking.user?._id
        };

        res.json({
            success: true,
            qrData: qrData,
            message: 'QR code data retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting ticket QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get ticket QR code',
            error: error.message
        });
    }
};

// Test endpoint to check ticket API is working
export const testTicketAPI = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Ticket API is working',
            user: req.user ? { id: req.user._id, role: req.user.role } : null,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ticket API test failed',
            error: error.message
        });
    }
}; 