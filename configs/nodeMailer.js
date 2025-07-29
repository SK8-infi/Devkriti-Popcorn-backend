import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

const sendEmail = async ({ to, subject, body }) => {
    try {
    const response = await transporter.sendMail({
            from: `"Popcorn Theater" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: body,
        });
        console.log('Email sent successfully:', response.messageId);
        return response;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

export default sendEmail;