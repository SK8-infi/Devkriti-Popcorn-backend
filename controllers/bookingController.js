import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from 'stripe'
import { setBookingTimeout } from '../utils/bookingTimeout.js';


// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats)=>{
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;
    } catch (error) {
        return false;
    }
}

// Function to release seats when payment fails
const releaseSeats = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if (showData) {
            selectedSeats.forEach(seat => {
                if (showData.occupiedSeats[seat]) {
                    delete showData.occupiedSeats[seat];
                }
            });
            showData.markModified('occupiedSeats');
            await showData.save();
        }
    } catch (error) {
        // Error releasing seats
    }
}

// Function to handle payment failure
export const handlePaymentFailure = async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }

        // Release the seats
        await releaseSeats(booking.show, booking.bookedSeats);

        // Update booking status
        booking.status = 'payment_failed';
        await booking.save();

        res.json({ success: true, message: 'Seats released successfully' });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            
            // Update booking status to paid
            if (session.metadata?.bookingId) {
                await updateBookingToPaid(session.metadata.bookingId);
            }
            break;
            
        case 'checkout.session.expired':
            const expiredSession = event.data.object;
            // Release seats if session expired
            if (expiredSession.metadata?.bookingId) {
                await releaseSeatsFromBooking(expiredSession.metadata.bookingId);
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            // Release seats if payment failed
            if (failedPayment.metadata?.bookingId) {
                await releaseSeatsFromBooking(failedPayment.metadata.bookingId);
            }
            break;
            
        default:
            // Unhandled event type
    }

    res.json({ received: true });
}

// Helper function to update booking to paid status
const updateBookingToPaid = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
            booking.isPaid = true;
            booking.status = 'confirmed';
            booking.paymentDate = new Date();
            await booking.save();
            return true; // Indicate success
        } else {
            return false; // Indicate failure
        }
    } catch (error) {
        return false; // Indicate failure
    }
}

// Helper function to release seats from booking ID
const releaseSeatsFromBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
            await releaseSeats(booking.show, booking.bookedSeats);
            booking.status = 'payment_failed';
            await booking.save();
        }
    } catch (error) {
        // Error releasing seats
    }
}

export const createBooking = async (req, res)=>{
    try {
        const userId = req.user._id;
        const {showId, selectedSeats, totalAmount} = req.body;
        const { origin } = req.headers;



        // Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if(!isAvailable){
            return res.json({success: false, message: "Selected Seats are not available."})
        }

        // Get the show details
        const showData = await Show.findById(showId).populate('movie');

        // Use the totalAmount from frontend if provided, otherwise calculate
        let finalAmount = totalAmount;
        if (!finalAmount) {
            // Fallback calculation using the old showPrice if totalAmount not provided
            finalAmount = showData.showPrice * selectedSeats.length;
        }

        // Validate minimum amount for Stripe
        if (finalAmount < 1) {
            return res.json({success: false, message: "Amount must be at least ₹1.00 for payment processing."});
        }

        // Create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: finalAmount,
            bookedSeats: selectedSeats
        })



        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');

        await showData.save();

         // Stripe Gateway Initialize
         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

         // Creating line items to for Stripe
         // Convert to paise (smallest unit of INR) - 1 INR = 100 paise
         const unitAmountInPaise = Math.floor(finalAmount * 100);
         
         // Ensure minimum amount (₹1 = 100 paise)
         const minimumAmount = 100; // ₹1.00 in paise
         const finalUnitAmount = Math.max(unitAmountInPaise, minimumAmount);
         
         
         
         const line_items = [{
            price_data: {
                currency: 'inr',
                product_data:{
                    name: showData.movie.title
                },
                unit_amount: finalUnitAmount
            },
            quantity: 1
         }]

         const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/payment-success`,
            cancel_url: `${origin}/movies/${showData.movie._id}/${showId}?payment_failed=true&booking_id=${booking._id}`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
            // Additional configuration to help prevent issues
            billing_address_collection: 'auto', // Collect billing address automatically
            customer_creation: 'always', // Create customer record for future payments
            locale: 'en', // Set language to prevent i18n errors
            // Additional options for better UX
            allow_promotion_codes: true, // Allow coupon codes
            phone_number_collection: { enabled: true } // Phone number collection for better customer service
         })

         

         booking.paymentLink = session.url
         await booking.save()

         // Set custom timeout for booking payment check (10 minutes)
         setBookingTimeout(booking._id.toString());

                   res.json({success: true, url: session.url})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const getOccupiedSeats = async (req, res)=>{
    try {
        
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, occupiedSeats})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// Manual endpoint to check and update payment status (for testing)
export const checkPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }



        res.json({ 
            success: true, 
            booking: {
                id: booking._id,
                isPaid: booking.isPaid,
                status: booking.status,
                paymentDate: booking.paymentDate,
                amount: booking.amount,
                bookedSeats: booking.bookedSeats
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Manual endpoint to force update payment status (for testing)
export const forceUpdatePaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { isPaid, status } = req.body;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }

        booking.isPaid = isPaid || booking.isPaid;
        booking.status = status || booking.status;
        if (isPaid) {
            booking.paymentDate = new Date();
        }
        
        await booking.save();
        


        res.json({ 
            success: true, 
            message: 'Payment status updated',
            booking: {
                id: booking._id,
                isPaid: booking.isPaid,
                status: booking.status,
                paymentDate: booking.paymentDate
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Test webhook endpoint for manual testing
export const testWebhook = async (req, res) => {
    try {
        const { bookingId } = req.body;

        
        if (!bookingId) {
            return res.json({ success: false, message: 'Booking ID required' });
        }
        
        const result = await updateBookingToPaid(bookingId);
        
        res.json({ 
            success: result, 
            message: result ? 'Payment confirmed successfully' : 'Failed to confirm payment' 
        });
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Simple webhook test endpoint
export const webhookTest = async (req, res) => {
    res.json({ success: true, message: 'Webhook test endpoint working' });
}

// Get user's bookings
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const bookings = await Booking.find({ user: userId })
            .populate({
                path: 'show',
                populate: [
                    {
                        path: 'movie',
                        select: 'title poster_path'
                    },
                    {
                        path: 'theatre',
                        select: 'name city rooms'
                    }
                ]
            })
            .sort({ createdAt: -1 }); // Most recent first



        // Process bookings to include formatted data
        const processedBookings = bookings.map(booking => {
            const show = booking.show;
            

            
            // Get room information for format
            let roomInfo = null;
            let format = 'Normal';
            if (show?.theatre?.rooms && show?.room) {
                roomInfo = show.theatre.rooms.find(room => room._id.toString() === show.room);
                format = roomInfo?.type || 'Normal';
            }
            
            const processedBooking = {
                ...booking.toObject(),
                show: {
                    ...show,
                    theatreName: show?.theatre?.name || 'Unknown Theatre',
                    theatreCity: show?.theatre?.city || '',
                    time: show?.showDateTime || null,
                    language: show?.language || 'Unknown',
                    format: format,
                    roomName: roomInfo?.name || 'Unknown Room'
                }
            };
            

            
            return processedBooking;
        });

        res.json({ 
            success: true, 
            bookings: processedBookings 
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Retry payment for a booking
export const retryPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId } = req.params;
        const { origin } = req.headers;



        // Find the booking and verify ownership
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }

        if (booking.user.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        if (booking.isPaid) {
            return res.json({ success: false, message: 'Booking is already paid' });
        }

        // Get show details
        const showData = await Show.findById(booking.show).populate('movie');
        if (!showData) {
            return res.json({ success: false, message: 'Show not found' });
        }

        // Validate minimum amount for Stripe
        if (booking.amount < 1) {
            return res.json({ success: false, message: "Amount must be at least ₹1.00 for payment processing." });
        }

        // Check if payment session is expired
        const now = new Date();
        const bookingTime = new Date(booking.createdAt);
        const timeDiff = now.getTime() - bookingTime.getTime();
        const tenMinutes = 10 * 60 * 1000; // 10 minutes for failed payments
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes for pending payments

        // Use different timeouts based on booking status
        const maxTime = booking.status === 'payment_failed' ? tenMinutes : thirtyMinutes;
        
        if (timeDiff > maxTime) {
            return res.json({ success: false, message: 'Payment session expired. Please book again.' });
        }

        // Create new Stripe session
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // Convert to paise (smallest unit of INR) - 1 INR = 100 paise
        const unitAmountInPaise = Math.floor(booking.amount * 100);
        
        // Ensure minimum amount (₹1 = 100 paise)
        const minimumAmount = 100; // ₹1.00 in paise
        const finalUnitAmount = Math.max(unitAmountInPaise, minimumAmount);
        

        
        const line_items = [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: finalUnitAmount
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/payment-success`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + (booking.status === 'payment_failed' ? 10 * 60 : 30 * 60), // 10 min for failed, 30 min for pending
            billing_address_collection: 'auto',
            customer_creation: 'always',
            locale: 'en',
            allow_promotion_codes: true,
            phone_number_collection: { enabled: true }
        });

        // Update booking with new payment link
        booking.paymentLink = session.url;
        await booking.save();



        res.json({ success: true, url: session.url });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Test payment confirmation manually
export const testPaymentConfirmation = async (req, res) => {
    try {
        const { bookingId } = req.body;

        
        if (!bookingId) {
            return res.json({ success: false, message: 'Booking ID required' });
        }
        
        // First check current status
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }
        

        
        // Try to update the booking
        const result = await updateBookingToPaid(bookingId);
        
        // Check the booking again after update
        const updatedBooking = await Booking.findById(bookingId);

        
        res.json({ 
            success: result, 
            message: result ? 'Payment confirmed successfully' : 'Failed to confirm payment',
            before: {
                isPaid: booking.isPaid,
                status: booking.status
            },
            after: {
                isPaid: updatedBooking.isPaid,
                status: updatedBooking.status
            }
        });
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Check Stripe configuration
export const checkStripeConfig = async (req, res) => {
    try {

        
        const config = {
            hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            secretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
            webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
            secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'Not set',
            webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7) || 'Not set'
        };
        

        
        res.json({ 
            success: true, 
            message: 'Stripe configuration check',
            config: config
        });
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// List all bookings (for testing)
export const listAllBookings = async (req, res) => {
    try {

        
        const bookings = await Booking.find({})
            .populate('user', 'name email')
            .populate('show', 'showDateTime')
            .sort({ createdAt: -1 })
            .limit(10); // Get last 10 bookings
        
        const bookingList = bookings.map(booking => ({
            id: booking._id,
            userId: booking.user?.name || booking.user?._id,
            showDateTime: booking.show?.showDateTime,
            amount: booking.amount,
            isPaid: booking.isPaid,
            status: booking.status,
            bookedSeats: booking.bookedSeats,
            createdAt: booking.createdAt,
            paymentDate: booking.paymentDate
        }));
        

        
        res.json({ 
            success: true, 
            message: 'All bookings retrieved',
            bookings: bookingList
        });
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}