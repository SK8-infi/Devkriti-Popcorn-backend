import Booking from '../models/Booking.js';
import Show from '../models/Show.js';

// Store active timeouts in memory
const activeTimeouts = new Map();

// Set timeout for booking payment (10 minutes)
export const setBookingTimeout = (bookingId) => {
    const timeoutDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    const timeoutId = setTimeout(async () => {
        await releaseSeatsAndDeleteBooking(bookingId);
        activeTimeouts.delete(bookingId);
    }, timeoutDuration);
    
    activeTimeouts.set(bookingId, timeoutId);
};

// Clear timeout when payment is completed
export const clearBookingTimeout = (bookingId) => {
    const timeoutId = activeTimeouts.get(bookingId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        activeTimeouts.delete(bookingId);
    }
};

// Release seats and delete booking if payment not completed
const releaseSeatsAndDeleteBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return;
        }
        
        // If payment is not made, release seats and delete booking
        if (!booking.isPaid) {
            const show = await Show.findById(booking.show);
            if (show) {
                // Release booked seats
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat];
                });
                show.markModified('occupiedSeats');
                await show.save();
            }
            
            // Delete the booking
            await Booking.findByIdAndDelete(booking._id);
        }
    } catch (error) {
        console.error(`Error processing booking timeout for ${bookingId}:`, error);
    }
};

// Get all active timeouts (for monitoring)
export const getActiveTimeouts = () => {
    return Array.from(activeTimeouts.keys());
}; 