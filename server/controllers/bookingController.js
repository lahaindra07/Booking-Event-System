const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const normalizeEmail = (email) => (email ? email.toString().trim().toLowerCase() : '');

exports.sendBookingOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.user.email);
        const otp = generateOTP();

        await OTP.deleteMany({ email, action: 'event_booking' });
        await OTP.create({ email, otp, action: 'event_booking' });

        const emailResult = await sendOTPEmail(email, otp, 'event_booking');

        res.json({
            message: emailResult.success
                ? 'OTP sent successfully to your email.'
                : 'OTP generated (email delivery failed - see devOtp).',
            emailSent: emailResult.success,
            devOtp: otp,
            otp: otp
        });
    } catch (error) {
        console.error('Send booking OTP error:', error);
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        const email = normalizeEmail(req.user.email);
        const otp = req.body.otp ? req.body.otp.toString().trim() : '';

        if (!otp) {
            return res.status(400).json({ message: 'OTP is required to confirm booking' });
        }

        // Verify OTP explicitly before proceeding
        const validOTP = await OTP.findOne({ email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking. Please request a new code.' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        await OTP.deleteMany({ email, action: 'event_booking' }); // cleanup

        // Send booking confirmation / details email to user
        await sendBookingEmail(req.user.email, req.user.name, event, booking, 'pending');

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        console.error('Book event error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        // Send confirmation email on admin confirmation
        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId, booking, 'confirmed');

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        console.error('Confirm booking error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore the seat if it was actually confirmed and deducted
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
