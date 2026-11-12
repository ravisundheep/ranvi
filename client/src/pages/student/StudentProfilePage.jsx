import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService, enquiryService } from '../../services';
import {
  User,
  Phone,
  Mail,
  BookOpen,
  Lock,
  ShieldCheck,
  Save,
  KeyRound,
  HelpCircle,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Compass,
} from 'lucide-react';

export const StudentProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    targetExam: user?.targetExam || '',
  });
  const [profileUpdating, setProfileUpdating] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwUpdating, setPwUpdating] = useState(false);

  // Guidance & Support Desk state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingGuidance, setSubmittingGuidance] = useState(false);
  const [guidanceForm, setGuidanceForm] = useState({
    type: 'CAREER_GUIDANCE',
    division: 'BANKERS_PATH',
    qualification: '',
    careerGoals: '',
    whatsappNumber: user?.phone || '',
    requestACall: false,
    message: '',
  });

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await enquiryService.getMyRequests();
      if (res?.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load guidance requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleGuidanceSubmit = async (e) => {
    e.preventDefault();
    if (!guidanceForm.message.trim()) {
      toastError('Please describe your query or guidance requirement');
      return;
    }
    setSubmittingGuidance(true);
    try {
      const payload = {
        fullName: user?.name || 'Student',
        email: user?.email || '',
        phone: user?.phone || guidanceForm.whatsappNumber || '0000000000',
        whatsappNumber: guidanceForm.whatsappNumber,
        requestACall: guidanceForm.requestACall,
        qualification: guidanceForm.qualification,
        careerGoals: guidanceForm.careerGoals,
        division: guidanceForm.division,
        type: guidanceForm.type,
        message: guidanceForm.message,
      };
      const res = await enquiryService.submitEnquiry(payload);
      if (res?.success) {
        success('Guidance request submitted successfully! Your Request ID is ' + (res.data?.requestId || ''));
        setGuidanceForm({
          type: 'CAREER_GUIDANCE',
          division: 'BANKERS_PATH',
          qualification: '',
          careerGoals: '',
          whatsappNumber: user?.phone || '',
          requestACall: false,
          message: '',
        });
        fetchMyRequests();
      }
    } catch (err) {
      toastError(err.message || 'Failed to submit guidance request');
    } finally {
      setSubmittingGuidance(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    try {
      await updateProfile(profileForm);
      success('Profile updated successfully');
    } catch (err) {
      toastError(err.message || 'Profile update failed');
    } finally {
      setProfileUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toastError('New password and confirm password do not match');
      return;
    }
    setPwUpdating(true);
    try {
      const res = await authService.changePassword(pwForm.currentPassword, pwForm.newPassword);
      if (res.success) {
        success('Password updated successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toastError(err.message || 'Password update failed');
    } finally {
      setPwUpdating(false);
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6 max-w-4xl w-full">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
          Student Profile & Device Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal information, examination target, and secure single-device login.
        </p>
        {user?.studentId && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#EAF3FF] rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student ID</span>
            <span className="text-sm font-black text-[#1769D2] font-mono tracking-wide">{user.studentId}</span>
          </div>
        )}
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none space-y-6 pr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#12356B] font-heading flex items-center gap-2">
              <User className="w-5 h-5 text-[#1769D2]" /> Personal Details
            </h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Examination</label>
              <input
                type="text"
                value={profileForm.targetExam}
                onChange={(e) => setProfileForm({ ...profileForm, targetExam: e.target.value })}
                placeholder="e.g. JAIIB 2026 / SBI PO"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <button
              type="submit"
              disabled={profileUpdating}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {profileUpdating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#12356B] font-heading flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#1769D2]" /> Change Password
            </h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>

            <button
              type="submit"
              disabled={pwUpdating}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1769D2] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
            >
              <Lock className="w-4 h-4" /> {pwUpdating ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Single Device Session Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#12356B]">Single-Active-Device Account Protection</h3>
            <p className="text-xs text-slate-500">Your account is bound to one active session to secure your classes and test history.</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
          If you switch to a new phone or computer, signing in there will seamlessly transfer your session and log out the previous device. If you ever face device lock issues, institute administrators can reset your registration instantly.
        </p>
      </div>

      {/* Career Guidance & Student Support Desk */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#1769D2]" /> Career Guidance & Student Support Desk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Request personalized career roadmap advice, exam pattern guidance, or get help from Ranvi faculty & counsellors.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full self-start sm:self-auto">
            100% Free Academic Guidance
          </span>
        </div>

        {/* Request Form */}
        <form onSubmit={handleGuidanceSubmit} className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Submit New Guidance / Support Request
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Request Category</label>
              <select
                value={guidanceForm.type}
                onChange={(e) => setGuidanceForm({ ...guidanceForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="CAREER_GUIDANCE">Career & Exam Selection Guidance</option>
                <option value="SUPPORT_TICKET">Academic Support & Preparation Doubt</option>
                <option value="COUNSELING">Specialized Counselling Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Division / Stream</label>
              <select
                value={guidanceForm.division}
                onChange={(e) => setGuidanceForm({ ...guidanceForm, division: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="BANKERS_PATH">Banker's Path (JAIIB, CAIIB, DBF, NISM)</option>
                <option value="COMPETITIVE_EXAMS">Competitive Exams (IBPS, SBI, SSC, RRB)</option>
                <option value="ENTRANCE_EXAMS">Entrance Exams</option>
                <option value="TUITIONS">Tuition Programs</option>
                <option value="GENERAL">General Guidance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Highest Qualification</label>
              <input
                type="text"
                value={guidanceForm.qualification}
                onChange={(e) => setGuidanceForm({ ...guidanceForm, qualification: e.target.value })}
                placeholder="e.g. B.Com, B.Tech, MBA, Inter (+2)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Career Goal</label>
              <input
                type="text"
                value={guidanceForm.careerGoals}
                onChange={(e) => setGuidanceForm({ ...guidanceForm, careerGoals: e.target.value })}
                placeholder="e.g. Bank PO, Scale-II Promotion, SSC CGL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Question, Syllabus Doubt, or Guidance Needed <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={guidanceForm.message}
              onChange={(e) => setGuidanceForm({ ...guidanceForm, message: e.target.value })}
              placeholder="Describe what guidance or academic roadmap you need (preparation strategy, book recommendations, study plan, etc.)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={guidanceForm.requestACall}
                  onChange={(e) => setGuidanceForm({ ...guidanceForm, requestACall: e.target.checked })}
                  className="rounded text-[#0B2545]"
                />
                <span>Request a Phone Call from Counsellor</span>
              </label>

              <div className="flex items-center gap-1 text-slate-600">
                <span className="font-semibold">WhatsApp:</span>
                <input
                  type="tel"
                  value={guidanceForm.whatsappNumber}
                  onChange={(e) => setGuidanceForm({ ...guidanceForm, whatsappNumber: e.target.value })}
                  placeholder="Optional 10-digit number"
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs w-36"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingGuidance}
              className="inline-flex items-center gap-1.5 bg-[#0B2545] hover:bg-[#12356B] text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingGuidance ? 'Submitting...' : 'Send Guidance Request'}
            </button>
          </div>
        </form>

        {/* Request History */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> My Guidance & Support Request History
          </h4>

          {loadingRequests ? (
            <p className="text-xs text-slate-400 py-3">Loading your request history...</p>
          ) : requests.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                You have not submitted any guidance requests yet. Need help choosing a course or preparation plan? Use the form above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1769D2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {req.requestId || 'REQ-PENDING'}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {req.type?.replace('_', ' ')} • {req.division?.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      req.status === 'ANSWERED' || req.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                    <strong className="text-slate-500 block text-[10.5px] uppercase">Your Query:</strong>
                    {req.message}
                  </p>

                  {req.resolutionNote && (
                    <div className="text-xs bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-emerald-950 space-y-1">
                      <strong className="text-emerald-800 block text-[10.5px] uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Official Counsellor / Faculty Resolution:
                      </strong>
                      <p className="whitespace-pre-line leading-relaxed">{req.resolutionNote}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>
                      Submitted on: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {req.requestACall && (
                      <span className="text-amber-700 font-semibold">📞 Phone callback requested</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
