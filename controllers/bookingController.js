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
        console.log(error.message);
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
            console.log('✅ Booking: Seats released for show:', showId);
        }
    } catch (error) {
        console.log('❌ Booking: Error releasing seats:', error.message);
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

        console.log('✅ Booking: Payment failure handled for booking:', bookingId);
        res.json({ success: true, message: 'Seats released successfully' });

    } catch (error) {
        console.log('❌ Booking: Error handling payment failure:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
    console.log('🔍 Booking: Webhook received:', req.headers['stripe-signature'] ? 'Signature present' : 'No signature');
    console.log('🔍 Booking: Webhook body length:', req.body?.length || 'No body');
    console.log('🔍 Booking: Webhook headers:', Object.keys(req.headers));
    
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ Booking: Webhook signature verified, event type:', event.type);
        console.log('🔍 Booking: Event data:', JSON.stringify(event.data, null, 2));
    } catch (err) {
        console.log('❌ Booking: Webhook signature verification failed:', err.message);
        console.log('🔍 Booking: Webhook secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length || 'No secret');
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('✅ Booking: Payment successful for session:', session.id);
            console.log('🔍 Booking: Session metadata:', session.metadata);
            console.log('🔍 Booking: Session payment status:', session.payment_status);
            console.log('🔍 Booking: Session status:', session.status);
            
            // Update booking status to paid
            if (session.metadata?.bookingId) {
                console.log('🔍 Booking: Found bookingId in metadata:', session.metadata.bookingId);
                const result = await updateBookingToPaid(session.metadata.bookingId);
                console.log('🔍 Booking: Update result:', result);
            } else {
                console.log('❌ Booking: No bookingId found in session metadata');
            }
            break;
            
        case 'checkout.session.expired':
            const expiredSession = event.data.object;
            console.log('⚠️ Booking: Session expired:', expiredSession.id);
            // Release seats if session expired
            if (expiredSession.metadata?.bookingId) {
                await releaseSeatsFromBooking(expiredSession.metadata.bookingId);
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ Booking: Payment failed:', failedPayment.id);
            // Release seats if payment failed
            if (failedPayment.metadata?.bookingId) {
                await releaseSeatsFromBooking(failedPayment.metadata.bookingId);
            }
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
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
            console.log('✅ Booking: Payment confirmed for booking:', bookingId);
            return true; // Indicate success
        } else {
            console.log('❌ Booking: Booking not found for payment confirmation:', bookingId);
            return false; // Indicate failure
        }
    } catch (error) {
        console.log('❌ Booking: Error updating booking to paid:', error.message);
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
            console.log('✅ Booking: Seats released from expired/failed booking:', bookingId);
        }
    } catch (error) {
        console.log('❌ Booking: Error releasing seats from booking:', error.message);
    }
}

export const createBooking = async (req, res)=>{
    try {
        const userId = req.user._id;
        const {showId, selectedSeats, totalAmount} = req.body;
        const { origin } = req.headers;

        console.log('🔍 Booking: Creating booking for user:', userId);
        console.log('🔍 Booking: Show ID:', showId);
        console.log('🔍 Booking: Selected seats:', selectedSeats);
        console.log('🔍 Booking: Total amount:', totalAmount);

        // Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if(!isAvailable){
            console.log('❌ Booking: Seats not available');
            return res.json({success: false, message: "Selected Seats are not available."})
        }

        // Get the show details
        const showData = await Show.findById(showId).populate('movie');
        console.log('🔍 Booking: Show data found:', showData ? 'Yes' : 'No');

        // Use the totalAmount from frontend if provided, otherwise calculate
        let finalAmount = totalAmount;
        if (!finalAmount) {
            // Fallback calculation using the old showPrice if totalAmount not provided
            finalAmount = showData.showPrice * selectedSeats.length;
        }

        console.log('🔍 Booking: Final amount:', finalAmount);

        // Create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: finalAmount,
            bookedSeats: selectedSeats
        })

        console.log('✅ Booking: Booking created with ID:', booking._id);

        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');

        await showData.save();
        console.log('✅ Booking: Show updated with occupied seats');

         // Stripe Gateway Initialize
         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

         // Creating line items to for Stripe
         const line_items = [{
            price_data: {
                currency: 'usd',
                product_data:{
                    name: showData.movie.title
                },
                unit_amount: Math.floor(finalAmount) * 100
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

         console.log('🔍 Booking: Stripe session created with metadata:', {
             sessionId: session.id,
             bookingId: booking._id.toString(),
             metadata: session.metadata
         });

         booking.paymentLink = session.url
         await booking.save()

         // Set custom timeout for booking payment check (10 minutes)
         setBookingTimeout(booking._id.toString());

         console.log('✅ Booking: Stripe session created, redirecting to payment');
         res.json({success: true, url: session.url})

    } catch (error) {
        console.log('❌ Booking: Error creating booking:', error.message);
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
        console.log(error.message);
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

        console.log('🔍 Booking: Current payment status:', {
            bookingId: booking._id,
            isPaid: booking.isPaid,
            status: booking.status,
            paymentDate: booking.paymentDate
        });

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
        console.log('❌ Booking: Error checking payment status:', error.message);
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
        
        console.log('✅ Booking: Payment status manually updated:', {
            bookingId: booking._id,
            isPaid: booking.isPaid,
            status: booking.status
        });

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
        console.log('❌ Booking: Error updating payment status:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Test webhook endpoint for manual testing
export const testWebhook = async (req, res) => {
    try {
        const { bookingId } = req.body;
        console.log('🔍 Booking: Testing webhook for booking:', bookingId);
        
        if (!bookingId) {
            return res.json({ success: false, message: 'Booking ID required' });
        }
        
        const result = await updateBookingToPaid(bookingId);
        console.log('🔍 Booking: Test webhook result:', result);
        
        res.json({ 
            success: result, 
            message: result ? 'Payment confirmed successfully' : 'Failed to confirm payment' 
        });
        
    } catch (error) {
        console.log('❌ Booking: Error in test webhook:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Simple webhook test endpoint
export const webhookTest = async (req, res) => {
    console.log('🔍 Booking: Webhook test endpoint called');
    console.log('🔍 Booking: Request body:', req.body);
    console.log('🔍 Booking: Request headers:', req.headers);
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

        console.log('✅ Booking: Retrieved bookings for user:', userId, 'Count:', bookings.length);

        // Process bookings to include formatted data
        const processedBookings = bookings.map(booking => {
            const show = booking.show;
            
            console.log('🔍 Booking: Processing booking:', {
                bookingId: booking._id,
                showId: show?._id,
                theatre: show?.theatre,
                room: show?.room,
                language: show?.language,
                time: show?.showDateTime,
                movie: show?.movie
            });
            
            // Get room information for format
            let roomInfo = null;
            let format = 'Normal';
            if (show?.theatre?.rooms && show?.room) {
                roomInfo = show.theatre.rooms.find(room => room._id.toString() === show.room);
                format = roomInfo?.type || 'Normal';
                console.log('🔍 Booking: Found room info:', { roomInfo, format });
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
            
            console.log('🔍 Booking: Processed booking:', {
                bookingId: processedBooking._id,
                theatreName: processedBooking.show.theatreName,
                language: processedBooking.show.language,
                format: processedBooking.show.format,
                time: processedBooking.show.time,
                movieId: processedBooking.show.movie?._id,
                movieTitle: processedBooking.show.movie?.title
            });
            
            return processedBooking;
        });

        res.json({ 
            success: true, 
            bookings: processedBookings 
        });

    } catch (error) {
        console.log('❌ Booking: Error getting user bookings:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Retry payment for a booking
export const retryPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId } = req.params;
        const { origin } = req.headers;

        console.log('🔍 Booking: Retrying payment for booking:', bookingId);

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

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
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

        console.log('✅ Booking: New payment session created for booking:', bookingId);

        res.json({ success: true, url: session.url });

    } catch (error) {
        console.log('❌ Booking: Error retrying payment:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Test payment confirmation manually
export const testPaymentConfirmation = async (req, res) => {
    try {
        const { bookingId } = req.body;
        console.log('🔍 Booking: Testing payment confirmation for booking:', bookingId);
        
        if (!bookingId) {
            return res.json({ success: false, message: 'Booking ID required' });
        }
        
        // First check current status
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' });
        }
        
        console.log('🔍 Booking: Current booking status:', {
            bookingId: booking._id,
            isPaid: booking.isPaid,
            status: booking.status,
            paymentDate: booking.paymentDate
        });
        
        // Try to update the booking
        const result = await updateBookingToPaid(bookingId);
        console.log('🔍 Booking: Update result:', result);
        
        // Check the booking again after update
        const updatedBooking = await Booking.findById(bookingId);
        console.log('🔍 Booking: Updated booking status:', {
            bookingId: updatedBooking._id,
            isPaid: updatedBooking.isPaid,
            status: updatedBooking.status,
            paymentDate: updatedBooking.paymentDate
        });
        
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
        console.log('❌ Booking: Error in test payment confirmation:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// Check Stripe configuration
export const checkStripeConfig = async (req, res) => {
    try {
        console.log('🔍 Booking: Checking Stripe configuration...');
        
        const config = {
            hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            secretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
            webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
            secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'Not set',
            webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7) || 'Not set'
        };
        
        console.log('🔍 Booking: Stripe config:', config);
        
        res.json({ 
            success: true, 
            message: 'Stripe configuration check',
            config: config
        });
        
    } catch (error) {
        console.log('❌ Booking: Error checking Stripe config:', error.message);
        res.json({ success: false, message: error.message });
    }
}

// List all bookings (for testing)
export const listAllBookings = async (req, res) => {
    try {
        console.log('🔍 Booking: Listing all bookings...');
        
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
        
        console.log('🔍 Booking: Found bookings:', bookingList.length);
        
        res.json({ 
            success: true, 
            message: 'All bookings retrieved',
            bookings: bookingList
        });
        
    } catch (error) {
        console.log('❌ Booking: Error listing bookings:', error.message);
        res.json({ success: false, message: error.message });
    }
}