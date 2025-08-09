import sendEmail from '../configs/nodeMailer.js';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import { generateTicket } from './ticketGenerator.js';

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: { path: 'movie', model: 'Movie' }
            })
            .populate('user');

        if (!booking || !booking.user || !booking.show) {
            console.error('Booking, user, or show not found for confirmation email');
            return;
        }

        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #F84565; text-align: center;">Booking Confirmed!</h2>
                    <h3>Hi ${booking.user.name},</h3>
                    <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed!</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #333;">Booking Details:</h4>
                        <p><strong>Movie:</strong> ${booking.show.movie.title}</p>
                        <p><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
                        <p><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
                        <p><strong>Seats:</strong> ${booking.bookedSeats.join(', ')}</p>
                        <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>
                    </div>
                    
                    <p style="text-align: center; color: #666;">Enjoy the show! 🍿</p>
                    <p style="text-align: center; color: #666;">— Popcorn Team</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: booking.user.email,
            subject: `Booking Confirmed: "${booking.show.movie.title}"`,
            body: emailBody
        });


    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
    }
};

// Send show reminder emails (called by cron job)
export const sendShowReminders = async () => {
    try {

        
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

        // Find shows starting in the next 8 hours
        const shows = await Show.find({
            showDateTime: { $gte: windowStart, $lte: in8Hours }
        }).populate('movie');

        let remindersSent = 0;
        let remindersFailed = 0;

        for (const show of shows) {
            if (!show.movie || !show.occupiedSeats) continue;

            const userIds = [...new Set(Object.values(show.occupiedSeats))];
            if (userIds.length === 0) continue;

            const users = await User.find({ _id: { $in: userIds } }).select('name email');

            for (const user of users) {
                try {
                    const emailBody = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <h2 style="color: #F84565; text-align: center;">Show Reminder</h2>
                                <h3>Hello ${user.name},</h3>
                                <p>This is a quick reminder that your movie:</p>
                                <h3 style="color: #F84565; text-align: center;">"${show.movie.title}"</h3>
                                <p style="text-align: center;">
                                    is scheduled for <strong>${new Date(show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</strong> at 
                                    <strong>${new Date(show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</strong>
                                </p>
                                <p style="text-align: center; background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">
                                    It starts in approximately <strong>8 hours</strong> - make sure you're ready!
                                </p>
                                <p style="text-align: center; color: #666;">Enjoy the show!<br/>— Popcorn Team</p>
                            </div>
                        </div>
                    `;

                    await sendEmail({
                        to: user.email,
                        subject: `Reminder: Your movie "${show.movie.title}" starts soon!`,
                        body: emailBody
                    });

                    remindersSent++;
                } catch (error) {
                    console.error(`Failed to send reminder to ${user.email}:`, error);
                    remindersFailed++;
                }
            }
        }


        return { sent: remindersSent, failed: remindersFailed };
    } catch (error) {
        console.error('Error sending show reminders:', error);
        return { sent: 0, failed: 0 };
    }
};

// Send new show notifications to all users
export const sendNewShowNotifications = async (movieTitle) => {
    try {

        
        const users = await User.find({});
        let notificationsSent = 0;
        let notificationsFailed = 0;

        for (const user of users) {
            try {
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #F84565; text-align: center;">New Show Added!</h2>
                            <h3>Hi ${user.name},</h3>
                            <p>We've just added a new show to our theater:</p>
                            <h3 style="color: #F84565; text-align: center;">"${movieTitle}"</h3>
                            <p style="text-align: center; background-color: #d4edda; padding: 15px; border-radius: 5px; color: #155724;">
                                Book your tickets now and don't miss out!
                            </p>
                            <p style="text-align: center;">
                                <a href="#" style="background-color: #F84565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Book Now
                                </a>
                            </p>
                            <p style="text-align: center; color: #666;">Thanks,<br/>— Popcorn Team</p>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: user.email,
                    subject: `New Show Added: ${movieTitle}`,
                    body: emailBody
                });

                notificationsSent++;
            } catch (error) {
                console.error(`Failed to send notification to ${user.email}:`, error);
                notificationsFailed++;
            }
        }


        return { sent: notificationsSent, failed: notificationsFailed };
    } catch (error) {
        console.error('Error sending new show notifications:', error);
        return { sent: 0, failed: 0 };
    }
};

// Send ticket email with PDF attachment
export const sendTicketEmail = async (bookingId) => {
    try {
        console.log('📧 Sending ticket email for booking:', bookingId);
        
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', model: 'Movie' },
                    { path: 'theatre', model: 'Theatre' }
                ]
            })
            .populate('user');

        if (!booking || !booking.user || !booking.show) {
            console.error('Booking, user, or show not found for ticket email');
            return { success: false, error: 'Booking data not found' };
        }

        // Generate ticket
        console.log('🎫 Generating ticket PDF...');
        const ticket = await generateTicket(booking);
        console.log('✅ Ticket PDF generated successfully');
        
        // Create email body
        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #F84565; text-align: center;">🎬 Your Movie Ticket</h2>
                    <h3>Hi ${booking.user.name},</h3>
                    <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed!</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #333;">Booking Details:</h4>
                        <p><strong>Movie:</strong> ${booking.show.movie.title}</p>
                        <p><strong>Theatre:</strong> ${booking.show.theatre?.name || 'Unknown Theatre'}</p>
                        <p><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-IN')}</p>
                        <p><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p><strong>Seats:</strong> ${booking.bookedSeats ? booking.bookedSeats.join(', ') : 'N/A'}</p>
                        <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>
                        <p><strong>Booking ID:</strong> ${booking._id}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404;">
                        <h4 style="margin-top: 0;">📋 Important Information:</h4>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Please arrive 15 minutes before showtime</li>
                            <li>Valid ID required for entry</li>
                            <li>Show this ticket (digital or printed) at the entrance</li>
                            <li>Mobile phones must be silent during the show</li>
                            <li>No refunds or exchanges</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; color: #666;">Enjoy the show! 🍿</p>
                    <p style="text-align: center; color: #666;">— Devkriti Popcorn Team</p>
                </div>
            </div>
        `;

        // Send email with PDF attachment
        console.log('📧 Sending email with ticket attachment...');
        await sendEmail({
            to: booking.user.email,
            subject: `🎬 Your Movie Ticket: "${booking.show.movie.title}"`,
            body: emailBody,
            attachments: [
                {
                    filename: `ticket-${booking._id}.pdf`,
                    content: ticket.pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        console.log('✅ Email sent successfully');

        console.log('✅ Ticket email sent successfully to:', booking.user.email);
        return { success: true };

    } catch (error) {
        console.error('❌ Error sending ticket email:', error);
        return { success: false, error: error.message };
    }
}; 