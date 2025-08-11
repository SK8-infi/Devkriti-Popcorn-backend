import stripe from "stripe";
import Booking from '../models/Booking.js'
import { clearBookingTimeout } from '../utils/bookingTimeout.js';
import { sendTicketEmail } from '../utils/emailService.js';
import { createPaymentSuccessNotification } from '../utils/notificationService.js';

export const stripeWebhooks = async (request, response)=>{
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })

                const session = sessionList.data[0];
                const { bookingId } = session.metadata;

                const booking = await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink: ""
                }).populate({
                    path: 'show',
                    populate: { path: 'movie', model: 'Movie' }
                }).populate('user');

                // Clear booking timeout (payment completed)
                clearBookingTimeout(bookingId);

                // Create payment success notification
                if (booking && booking.user && booking.show && booking.show.movie) {
                    try {
                        await createPaymentSuccessNotification(
                            booking.user._id,
                            booking.show.movie.title,
                            booking.amount
                        );
                    } catch (notificationError) {
                        console.error('Error creating payment success notification:', notificationError);
                    }
                }

                // Send ticket email with PDF attachment
                sendTicketEmail(bookingId).catch(error => {
                    console.error('Error sending ticket email:', error);
                });
                
                break;
            }
        
            default:
                // Unhandled event type
        }
        response.json({received: true})
    } catch (err) {
        console.error("Webhook processing error:", err);
        response.status(500).send("Internal Server Error");
    }
}