const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normalizeEmail = (email) => (email ? email.toString().trim().toLowerCase() : '');

exports.register = async (req, res) => {
    try {
        const { name, password, role } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        let user = await User.findOne({ email });

        // If user exists and is already verified, do not allow re-registration
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user && !user.isVerified) {
            // Update existing unverified user with new details
            user.name = name || user.name;
            user.password = hashedPassword;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'user', // Hardcoded to prevent frontend passing role
                isVerified: false
            });
        }

        // Clean up any stale OTPs for this email and action
        await OTP.deleteMany({ email, action: 'account_verification' });

        const otp = generateOTP();
        await OTP.create({ email, otp, action: 'account_verification' });

        const emailResult = await sendOTPEmail(email, otp, 'account_verification');

        res.status(201).json({
            message: emailResult.success
                ? 'OTP sent to your email. Please verify.'
                : 'Account created. OTP generated (email delivery failed - see devOtp).',
            email: user.email,
            emailSent: emailResult.success,
            devOtp: otp,
            otp: otp
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            await OTP.deleteMany({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            const emailResult = await sendOTPEmail(user.email, otp, 'account_verification');

            return res.status(403).json({
                message: emailResult.success
                    ? 'Account not verified. A new OTP has been sent to your email.'
                    : 'Account not verified. A new OTP has been generated (email delivery failed - see devOtp).',
                needsVerification: true,
                email: user.email,
                emailSent: emailResult.success,
                devOtp: otp,
                otp: otp
            });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = req.body.otp ? req.body.otp.toString().trim() : '';

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const validOTP = await OTP.findOne({ email, otp, action: 'account_verification' });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please check the code or request a new one.' });
        }

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Clean up OTPs after successful verification
        await OTP.deleteMany({ email, action: 'account_verification' });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role),
            message: 'Account verified successfully!'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const action = req.body.action || 'account_verification';

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (action === 'account_verification') {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'No registered user found with this email' });
            }
            if (user.isVerified) {
                return res.status(400).json({ message: 'Account is already verified. Please log in.' });
            }
        }

        const otp = generateOTP();
        await OTP.deleteMany({ email, action });
        await OTP.create({ email, otp, action });

        const emailResult = await sendOTPEmail(email, otp, action);

        res.json({
            message: emailResult.success
                ? 'A new OTP has been sent to your email.'
                : 'A new OTP has been generated (email delivery failed - see devOtp).',
            email,
            emailSent: emailResult.success,
            devOtp: otp,
            otp: otp
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
