const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create transporter with sanitized credentials
const createTransporter = () => {
    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'imtonystark1298@gmail.com';
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user,
            pass
        }
    });
};

const sendBookingEmail = async (userEmail, userName, eventOrTitle, booking = null, status = 'confirmed') => {
    try {
        const transporter = createTransporter();
        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'imtonystark1298@gmail.com';

        const isObject = typeof eventOrTitle === 'object' && eventOrTitle !== null;
        const title = isObject ? eventOrTitle.title : eventOrTitle;
        const date = isObject && eventOrTitle.date
            ? new Date(eventOrTitle.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';
        const location = isObject ? (eventOrTitle.location || 'N/A') : 'N/A';
        const price = isObject ? (eventOrTitle.ticketPrice === 0 ? 'Free' : `₹${eventOrTitle.ticketPrice}`) : 'N/A';
        const bookingId = booking ? (booking._id ? booking._id.toString() : booking) : 'N/A';
        const isPending = status === 'pending';

        const subject = isPending ? `Booking Received: ${title}` : `Booking Confirmed: ${title}`;

        const mailOptions = {
            from: `"BookMyEvent" <${user}>`,
            to: userEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                        <h1 style="color: #111827; margin: 0; font-size: 26px; font-weight: 800;">BookMyEvent</h1>
                        <p style="color: #6b7280; margin: 6px 0 0 0; font-size: 14px;">${isPending ? 'Your Booking Request Has Been Received' : 'Your Ticket Booking is Confirmed!'}</p>
                    </div>

                    <div style="padding: 24px 0;">
                        <p style="font-size: 16px; color: #111827;">Hi <strong>${userName || 'Guest'}</strong>,</p>
                        <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                            ${isPending
                    ? `Thank you for choosing BookMyEvent! We have received your booking request for <strong>${title}</strong>. Your ticket is currently awaiting confirmation from the administrator.`
                    : `Great news! Your booking for <strong>${title}</strong> has been officially confirmed by the administrator.`}
                        </p>

                        <div style="background-color: #f9fafb; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
                            <h3 style="margin-top: 0; color: #111827; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Booking Details</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #6b7280;">Event:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #111827;">${title}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Date:</td>
                                    <td style="padding: 8px 0;">${date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Location:</td>
                                    <td style="padding: 8px 0;">${location}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Price:</td>
                                    <td style="padding: 8px 0; font-weight: 600; color: #059669;">${price}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Booking ID:</td>
                                    <td style="padding: 8px 0; font-family: monospace; color: #4b5563;">${bookingId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Status:</td>
                                    <td style="padding: 8px 0;">
                                        <span style="background-color: ${isPending ? '#fef3c7' : '#d1fae5'}; color: ${isPending ? '#92400e' : '#065f46'}; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                                            ${isPending ? 'Pending Approval' : 'Confirmed'}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
                            You can check your status and view your tickets at any time from your 
                            <a href="http://localhost:5173/dashboard" style="color: #2563eb; font-weight: 600; text-decoration: underline;">User Dashboard</a>.
                        </p>
                    </div>

                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
                        &copy; ${new Date().getFullYear()} BookMyEvent Platform. All rights reserved.
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Booking notification (${status}) sent successfully to ${userEmail} (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[Email] Error sending booking confirmation to ${userEmail}:`, error.message);
        return { success: false, error: error.message };
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    console.log(`\n========================================`);
    console.log(`🔑 [BookMyEvent OTP] To: ${userEmail} | Type: ${type}`);
    console.log(`👉 OTP CODE: ${otp}`);
    console.log(`========================================\n`);

    try {
        const transporter = createTransporter();
        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'imtonystark1298@gmail.com';
        const title = type === 'account_verification' ? 'Verify your BookMyEvent Account' : 'BookMyEvent Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following 6-digit OTP to verify your new BookMyEvent account.'
            : 'Please use the following 6-digit OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: `"BookMyEvent" <${user}>`,
            to: userEmail,
            subject: `${title} - OTP: ${otp}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; text-align: center;">
                    <h2 style="color: #111827; margin-top: 0; font-size: 22px;">${title}</h2>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">${msg}</p>
                    <div style="margin: 25px auto; padding: 16px 24px; font-size: 32px; font-weight: 800; background-color: #f3f4f6; color: #111827; width: max-content; letter-spacing: 8px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                    <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 14px; font-size: 12px; color: #9ca3af;">
                        &copy; ${new Date().getFullYear()} BookMyEvent Platform
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] OTP email successfully sent to ${userEmail} for ${type} (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.warn(`\n⚠️  [Email Notice] Failed to deliver email to ${userEmail}: ${error.message}`);
        console.warn(`👉 Tip: Gmail requires a 16-character App Password (from https://myaccount.google.com/apppasswords), NOT your normal password.`);
        console.warn(`👉 Use the OTP logged above for verification.\n`);
        return { success: false, error: error.message, otp };
    }
};

module.exports = { sendBookingEmail, sendOTPEmail };
