import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const { register, verifyOTP, resendOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await register(name, email, password);
                setShowOTP(true);
                if (data.devOtp || data.otp) {
                    setDevOtp(data.devOtp || data.otp);
                }
                setInfoMsg('An OTP has been sent to your email. Please verify your account.');
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        try {
            const data = await resendOTP(email, 'account_verification');
            if (data.devOtp || data.otp) {
                setDevOtp(data.devOtp || data.otp);
            }
            setInfoMsg('A fresh OTP has been sent to your email.');
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || 'Failed to resend OTP'));
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create an Account</h2>
                <p className="text-gray-500">Join BookMyEvent today</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        {infoMsg && (
                            <div className="text-sm text-gray-700 bg-blue-50 p-3 mb-4 rounded-lg border border-blue-200">
                                {infoMsg}
                            </div>
                        )}

                        {devOtp && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-amber-800 uppercase block">OTP Code:</span>
                                    <span className="text-xl font-mono font-bold text-gray-900 tracking-wider">{devOtp}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOtp(devOtp)}
                                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-md transition"
                                >
                                    Auto-fill OTP
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Verification Code (OTP)</label>
                            <span className="text-xs text-gray-500 font-mono">{email}</span>
                        </div>

                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-xl"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.trim())}
                            maxLength="6"
                        />

                        <div className="flex items-center justify-between mt-3 text-xs">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-gray-900 font-semibold hover:underline disabled:opacity-50"
                            >
                                {resendLoading ? 'Sending...' : 'Didn’t get code? Resend OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowOTP(false); setOtp(''); setDevOtp(''); setError(''); }}
                                className="text-gray-500 hover:text-gray-800"
                            >
                                Change email
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || (showOTP && !otp)}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black focus:ring-4 focus:ring-gray-200 transition shadow-md mt-4 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify & Complete' : 'Sign Up')}
                </button>
            </form>

            {!showOTP && (
                <p className="text-center mt-6 text-gray-600">
                    Already have an account? <Link to="/login" className="text-gray-900 font-bold hover:underline">Sign in</Link>
                </p>
            )}
        </div>
    );
};

export default Register;
