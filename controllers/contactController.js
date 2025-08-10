import sendEmail from '../configs/nodeMailer.js';

// Send contact form email
export const sendContactEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create email body
        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #F84565; text-align: center; margin-bottom: 30px;">New Contact Form Submission</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #F84565; padding-bottom: 10px;">Contact Details</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #555;">Name:</strong>
                            <span style="color: #333; margin-left: 10px;">${name}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #555;">Email:</strong>
                            <span style="color: #333; margin-left: 10px;">${email}</span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #555;">Subject:</strong>
                            <span style="color: #333; margin-left: 10px;">${subject}</span>
                        </div>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; color: #856404;">Message:</h4>
                        <p style="color: #333; line-height: 1.8; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="text-align: center; color: #666; font-size: 14px;">
                        <p>This message was sent from the Devkriti Popcorn contact form.</p>
                        <p>Submitted on: ${new Date().toLocaleString('en-US', { 
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                </div>
            </div>
        `;

        // Send email to www17popcorn@gmail.com
        await sendEmail({
            to: 'www17popcorn@gmail.com',
            subject: `Contact Form: ${subject}`,
            body: emailBody
        });

        // Send confirmation email to the user
        const userConfirmationBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #F84565; text-align: center; margin-bottom: 30px;">Thank You for Contacting Us!</h2>
                    
                    <p style="color: #333; font-size: 16px;">Dear ${name},</p>
                    
                    <p style="color: #333; line-height: 1.8;">Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #333;">Your Message Details:</h4>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}</p>
                    </div>
                    
                    <p style="color: #333; line-height: 1.8;">We typically respond within 24-48 hours during business days. If you have an urgent matter, please don't hesitate to call us.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #666; font-size: 14px;">Best regards,<br>The Devkriti Popcorn Team</p>
                    </div>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Thank you for contacting Devkriti Popcorn',
            body: userConfirmationBody
        });

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!'
        });

    } catch (error) {
        console.error('Error sending contact email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
};
