import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

const sendEmail = async ({ to, subject, body, attachments = [] }) => {
    try {
        const mailOptions = {
            from: `"Devkriti Popcorn" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: body,
        };

        // Add attachments if provided
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const response = await transporter.sendMail(mailOptions);
        return response;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

export default sendEmail;