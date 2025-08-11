import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { sendCancellationEmail } from '../utils/emailService.js';
import { createCancellationNotification } from '../utils/notificationService.js';

// Calculate refund based on time before show
const calculateRefund = (showDateTime, originalAmount) => {
    const now = new Date();
    const showTime = new Date(showDateTime);
    const hoursUntilShow = (showTime - now) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    
    if (hoursUntilShow >= 24) {
        refundPercentage = 80; // 80% refund if 24+ hours
    } else if (hoursUntilShow >= 12) {
        refundPercentage = 50; // 50% refund if 12-24 hours
    } else if (hoursUntilShow >= 2) {
        refundPercentage = 25; // 25% refund if 2-12 hours
    } else {
        refundPercentage = 0; // No refund if less than 2 hours
    }
    
    const refundAmount = Math.floor((originalAmount * refundPercentage) / 100);
    
    return {
        refundPercentage,
        refundAmount,
        hoursUntilShow: Math.floor(hoursUntilShow * 100) / 100 // Round to 2 decimal places
    };
};

// Get cancellation policy and refund estimate
export const getCancellationPolicy = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        // Find and validate booking
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' }
                ]
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (booking.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking can be cancelled
        if (booking.isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel unpaid booking'
            });
        }

        // Calculate refund
        const refundInfo = calculateRefund(booking.show.showDateTime, booking.amount);
        
        res.json({
            success: true,
            booking: {
                id: booking._id,
                movieTitle: booking.show.movie.title,
                theatreName: booking.show.theatre.name,
                showDateTime: booking.show.showDateTime,
                seats: booking.bookedSeats,
                originalAmount: booking.amount
            },
            refundInfo,
            policy: {
                '24+ hours': '80% refund',
                '12-24 hours': '50% refund',
                '2-12 hours': '25% refund',
                'Less than 2 hours': 'No refund'
            }
        });

    } catch (error) {
        console.error('Error getting cancellation policy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cancellation policy',
            error: error.message
        });
    }
};

// Cancel booking and process refund
export const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        console.log(`🚫 Processing cancellation for booking: ${bookingId}, user: ${userId}`);

        // Find and validate booking
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' }
                ]
            })
            .populate('user');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check ownership
        if (booking.user._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Validation checks
        if (booking.isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (!booking.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel unpaid booking'
            });
        }

        // Check if show has already happened
        const now = new Date();
        const showTime = new Date(booking.show.showDateTime);
        if (showTime <= now) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel booking for past shows'
            });
        }

        // Calculate refund
        const refundInfo = calculateRefund(booking.show.showDateTime, booking.amount);
        
        // Update booking with cancellation details
        booking.isCancelled = true;
        booking.status = 'cancelled';
        booking.cancellationDate = new Date();
        booking.cancellationReason = reason || 'User requested cancellation';
        booking.refundAmount = refundInfo.refundAmount;
        booking.refundPercentage = refundInfo.refundPercentage;
        booking.refundStatus = refundInfo.refundAmount > 0 ? 'processing' : 'completed';

        await booking.save();

        // Release seats by updating show's occupiedSeats
        await releaseCancelledSeats(booking.show._id, booking.bookedSeats);

        // Send cancellation email
        try {
            await sendCancellationEmail(booking);
            console.log('✅ Cancellation email sent successfully');
        } catch (emailError) {
            console.error('❌ Error sending cancellation email:', emailError);
            // Don't fail the cancellation if email fails
        }

        // Create cancellation notification
        try {
            await createCancellationNotification(
                booking.user,
                booking.show.movie.title,
                booking.refundAmount
            );
        } catch (notificationError) {
            console.error('❌ Error creating cancellation notification:', notificationError);
            // Don't fail the cancellation if notification fails
        }

        console.log(`✅ Booking ${bookingId} cancelled successfully. Refund: ₹${refundInfo.refundAmount}`);

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            cancellation: {
                bookingId: booking._id,
                cancellationDate: booking.cancellationDate,
                refundAmount: booking.refundAmount,
                refundPercentage: booking.refundPercentage,
                refundStatus: booking.refundStatus,
                hoursUntilShow: refundInfo.hoursUntilShow
            }
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
};

// Helper function to release seats (Show.occupiedSeats is an object map: { [seatId]: userId })
const releaseCancelledSeats = async (showId, cancelledSeats) => {
    try {
        console.log(`🪑 Releasing seats for show ${showId}:`, cancelledSeats);

        const show = await Show.findById(showId);
        if (!show) {
            console.error('Show not found for seat release');
            return;
        }

        if (!show.occupiedSeats || typeof show.occupiedSeats !== 'object') {
            console.warn('occupiedSeats not initialized as object; initializing now');
            show.occupiedSeats = {};
        }

        let releasedCount = 0;
        for (const seat of cancelledSeats) {
            if (show.occupiedSeats[seat]) {
                delete show.occupiedSeats[seat];
                releasedCount += 1;
            }
        }

        show.markModified('occupiedSeats');
        await show.save();
        console.log(`✅ Released ${releasedCount}/${cancelledSeats.length} seats from show ${showId}`);
    } catch (error) {
        console.error('Error releasing seats:', error);
        // Don't throw error - seat release failure shouldn't block cancellation
    }
};

// Get user's cancellation history
export const getCancellationHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const cancelledBookings = await Booking.find({
            user: userId,
            isCancelled: true
        })
        .populate({
            path: 'show',
            populate: [
                { path: 'movie', model: 'Movie' },
                { path: 'theatre', model: 'Theatre' }
            ]
        })
        .sort({ cancellationDate: -1 });

        res.json({
            success: true,
            cancelledBookings: cancelledBookings.map(booking => ({
                id: booking._id,
                movieTitle: booking.show.movie.title,
                theatreName: booking.show.theatre.name,
                showDateTime: booking.show.showDateTime,
                seats: booking.bookedSeats,
                originalAmount: booking.amount,
                refundAmount: booking.refundAmount,
                refundPercentage: booking.refundPercentage,
                refundStatus: booking.refundStatus,
                cancellationDate: booking.cancellationDate,
                cancellationReason: booking.cancellationReason
            }))
        });

    } catch (error) {
        console.error('Error getting cancellation history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cancellation history',
            error: error.message
        });
    }
};

// Admin: Get all cancellations
export const getAllCancellations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const cancelledBookings = await Booking.find({ isCancelled: true })
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' }
                ]
            })
            .populate('user', 'name email')
            .sort({ cancellationDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalCancellations = await Booking.countDocuments({ isCancelled: true });

        res.json({
            success: true,
            cancelledBookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCancellations / limit),
                totalCancellations,
                hasNext: page < Math.ceil(totalCancellations / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error getting all cancellations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cancellations',
            error: error.message
        });
    }
};