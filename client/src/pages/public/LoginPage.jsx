import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RanviLogo } from '../../components/common/RanviLogo';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectPath = location.state?.from || '/student/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await login(email, password);
      success(`Welcome back, ${data.user.name}!`);

      if (['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'SUPPORT_STAFF', 'FINANCE_STAFF'].includes(data.user.role)) {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials');
      toastError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] to-[#EAF3FF]/40">
      <div className="max-w-md w-full space-y-6">
        {/* Luxury Login Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-5 relative">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@ranviinstitutions.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#1769D2] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white font-black py-3.5 px-4 rounded-xl text-sm transition-all shadow-md hover:scale-102 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4 text-[#F4B942]" />
            </button>
          </form>

          {/* Single-Device Information notice */}
          <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-[11px] text-blue-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#1769D2] shrink-0 mt-0.5" />
            <span>
              <strong>Single-Device Concurrency:</strong> Only one active device session is permitted per student account. New logins automatically revoke prior sessions.
            </span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600 font-semibold">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-[#1769D2] font-black hover:underline">
            Register as a Student
          </Link>
        </p>
      </div>
    </div>
  );
};
