import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { KeyRound, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP + New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toastError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(email.trim(), 'FORGOT_PASSWORD');
      success(res.message || 'Verification OTP sent to your email.');
      setStep(2);
      setCooldown(60);
    } catch (err) {
      toastError(err.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toastError('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      success(res.message || 'Password reset successful!');
      navigate('/login');
    } catch (err) {
      toastError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B1E3D] to-[#1769D2] text-white flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-7 h-7 text-[#F4B942]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E3D] font-heading">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {step === 1
              ? 'Enter your registered email to receive a 6-digit verification OTP.'
              : `Enter the 6-digit OTP sent to ${email} and choose a new password.`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-xl space-y-5">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white font-black py-3.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                <ArrowRight className="w-4 h-4 text-[#F4B942]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">6-Digit Email OTP</label>
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-[#1769D2] hover:underline disabled:text-slate-400 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-mono tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0B1E3D] text-white font-black py-3.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Resetting Password...' : 'Verify OTP & Reset Password'}
                <ShieldCheck className="w-4 h-4 text-[#F4B942]" />
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs font-bold text-slate-500 hover:text-[#12356B] py-1"
              >
                Use a different email address
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 font-semibold">
          <Link to="/login" className="inline-flex items-center gap-1 text-[#1769D2] font-black hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
