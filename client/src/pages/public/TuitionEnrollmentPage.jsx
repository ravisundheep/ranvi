import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { tuitionService, enrollmentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Printer,
  ChevronRight,
  User,
  Mail,
  Phone,
  Home,
  BookOpen,
} from 'lucide-react';

export const TuitionEnrollmentPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [program, setProgram] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completedEnrollment, setCompletedEnrollment] = useState(null);

  // Form state
  const [batchTiming, setBatchTiming] = useState('Evening (05:30 PM - 07:30 PM)');
  const [parentName, setParentName] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Require student login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // 2. Fetch program by slug
  useEffect(() => {
    let isMounted = true;
    const fetchProgram = async () => {
      try {
        setLoading(true);
        const res = await tuitionService.getProgramBySlug(slug);
        if (isMounted && res?.success && res.data) {
          const prog = res.data.course || res.data;
          setProgram(prog);
          if (Array.isArray(prog.subscriptionPlans) && prog.subscriptionPlans.length > 0) {
            setSelectedPlan(prog.subscriptionPlans[0]);
          }
          if (res.data.userAccess?.isEnrolled || prog.isEnrolled) {
            setAlreadyEnrolled(true);
          }
          if (prog.batchTimings && prog.batchTimings.length > 0) {
            setBatchTiming(prog.batchTimings[0]);
          }
        }
      } catch (err) {
        toastError(err.message || 'Failed to load tuition program details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (slug) fetchProgram();
    return () => {
      isMounted = false;
    };
  }, [slug, toastError]);

  // Handle Enrollment & Payment Submission
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!program || !program._id) return;

    if (!user?.phone) {
      toastError('Please ensure a valid phone number is set in your profile');
      return;
    }

    try {
      setProcessing(true);

      // 1. Create Enrollment Intent on Backend
      const intentRes = await enrollmentService.createIntent({
        courseId: program._id,
        preferredBatch: batchTiming,
        batchTiming,
        parentName,
        studentSchool,
        address,
        notes,
        durationMonths: selectedPlan ? selectedPlan.durationMonths : null,
      });

      if (!intentRes?.success || !intentRes.data) {
        throw new Error(intentRes?.message || 'Could not initiate enrollment process');
      }

      if (intentRes.data.isFree) {
        success('Free enrollment confirmed and active!');
        setCompletedEnrollment(intentRes.data);
        setProcessing(false);
        return;
      }

      const { enrollmentId, razorpayOrderId, amount, currency, keyId, key } = intentRes.data;
      const resolvedKey = keyId || key;

      // 2. Require authentic Razorpay Checkout SDK
      if (!window.Razorpay || !resolvedKey || !razorpayOrderId) {
        toastError('Razorpay payment gateway is unavailable. Please refresh the page or contact support.');
        setProcessing(false);
        return;
      }

      const options = {
        key: resolvedKey,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'Ranvi Institutions',
        description: `Enrollment: ${program.title}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#0B2545',
        },
        handler: async function (response) {
          try {
            const verifyRes = await enrollmentService.verifyPayment({
              enrollmentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes?.success) {
              success('Enrollment confirmed and active!');
              setCompletedEnrollment(verifyRes.data?.enrollment || verifyRes.data);
            }
          } catch (vErr) {
            toastError(vErr.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toastError(response?.error?.description || 'Payment failed in gateway. Please retry.');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      if (err.message && (err.message.includes('already enrolled') || err.message.includes('active subscription'))) {
        setAlreadyEnrolled(true);
      }
      toastError(err.message || 'Enrollment checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading enrollment details...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-black text-slate-800">Program Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          The tuition coaching program you requested could not be located or is no longer open for admission.
        </p>
        <Link
          to="/tuition-programs"
          className="mt-4 px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#1E293B]"
        >
          View All Tuition Programs
        </Link>
      </div>
    );
  }

  // 3. Official Enrollment Confirmation Receipt Screen
  if (completedEnrollment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6 print:border-none print:shadow-none">
            {/* Success Header */}
            <div className="text-center space-y-2 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-[#0B2545] font-serif">
                Enrollment Confirmed!
              </h1>
              <p className="text-xs text-slate-500">
                Official Tuition & Coaching Admission Receipt
              </p>
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs font-black rounded-lg border border-emerald-200 mt-1">
                ID: {completedEnrollment.enrollmentId}
              </div>
            </div>

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Program Name</span>
                <p className="font-bold text-slate-900">{program.title}</p>
                <p className="text-[11px] text-slate-500">{program.division || 'TUITIONS'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Student Name</span>
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Batch Schedule</span>
                <p className="font-bold text-slate-900">{completedEnrollment.batchTiming || batchTiming}</p>
                <p className="text-[11px] text-slate-500">Mode: {program.mode || 'BOTH'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Fee Paid</span>
                <p className="font-black text-emerald-600 text-sm">
                  ₹{(completedEnrollment?.finalAmount ?? program.fee ?? program.price ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold">Payment Status: PAID</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Download Receipt
              </button>
              <Link
                to="/student/enrollments"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] text-white font-bold text-xs hover:bg-[#1E293B] transition-colors"
              >
                View in My Enrollments
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3.5. Prevent Duplicate Purchases
  if (alreadyEnrolled) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-emerald-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B2545]">
            Active Subscription Confirmed
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You already have an active subscription for <strong>{program?.title || 'this program'}</strong>.
            Your seat is reserved and all learning resources are unlocked in your Student Portal.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              to="/student/my-courses"
              className="bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5"
            >
              <span>View My Program & Classes</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/student/enrollments"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-3 rounded-xl transition-colors inline-flex items-center justify-center"
            >
              Payment History & Receipts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Enrollment Checkout Form
  const currentPrice = selectedPlan ? selectedPlan.price : (program.fee ?? program.price ?? 0);
  const originalPrice = selectedPlan
    ? (selectedPlan.originalPrice || selectedPlan.price)
    : (program.originalPrice ?? program.fee ?? program.price ?? currentPrice);
  const discountAmount = originalPrice > currentPrice ? originalPrice - currentPrice : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb / Back link */}
        <Link
          to={`/tuition-programs/${program.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B2545] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Program Details
        </Link>

        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif">
            Tuition & Coaching Enrollment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your registration and confirm your admission seat for {program.title}
          </p>
        </div>

        <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-4">
            {/* Student Info Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                <User className="w-4 h-4 text-[#1769D2]" />
                Student Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={user?.phone || ''}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. S. Ramakrishna"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">School / College Name & Class</label>
                  <input
                    type="text"
                    value={studentSchool}
                    onChange={(e) => setStudentSchool(e.target.value)}
                    placeholder="e.g. Kendriya Vidyalaya / Class 10"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>
            </div>

            {/* Subscription Duration Selection */}
            {Array.isArray(program.subscriptionPlans) && program.subscriptionPlans.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                <h2 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#1769D2]" />
                  Select Subscription Plan Duration
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {program.subscriptionPlans.map((plan, pIdx) => {
                    const isSelected = selectedPlan?.durationMonths === plan.durationMonths;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0B2545] bg-blue-50/50 ring-2 ring-[#0B2545]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs font-black text-[#0B2545]">
                          {plan.label || `${plan.durationMonths} Months`}
                        </div>
                        <div className="text-base font-black text-[#1769D2] mt-1">
                          ₹{plan.price?.toLocaleString('en-IN')}
                        </div>
                        {plan.originalPrice && plan.originalPrice > plan.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{plan.originalPrice?.toLocaleString('en-IN')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Batch & Schedule Selection */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1769D2]" />
                Select Preferred Batch
              </h2>

              <div className="space-y-2">
                {[
                  'Morning (06:00 AM - 08:00 AM)',
                  'Evening (05:30 PM - 07:30 PM)',
                  'Weekend Intensive (10:00 AM - 02:00 PM)',
                ].map((timing) => (
                  <label
                    key={timing}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      batchTiming === timing
                        ? 'border-[#0B2545] bg-blue-50/40 text-[#0B2545] font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <input
                        type="radio"
                        name="batchTiming"
                        checked={batchTiming === timing}
                        onChange={() => setBatchTiming(timing)}
                        className="text-[#0B2545] focus:ring-0 cursor-pointer"
                      />
                      <span>{timing}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Regular Live Batch</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Address & Additional Remarks */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#0B2545] flex items-center gap-2">
                <Home className="w-4 h-4 text-[#1769D2]" />
                Residential Address & Notes
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Residential Address / City</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter door no, street, city & pincode"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Special Requirements or Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Focus on Physics numericals, Board exam preparation"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 sticky top-24">
              <h2 className="text-sm font-black text-[#0B2545]">Order Summary</h2>

              {/* Selected Program Mini-Card */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {program.division || 'TUITION'}
                </span>
                <h3 className="font-black text-slate-900 text-xs leading-snug">
                  {program.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mode: <span className="font-semibold text-slate-700">{program.mode || 'ONLINE & OFFLINE'}</span>
                </p>
                {program.availableSeats !== undefined && (
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ✓ {program.availableSeats} Seats Available
                  </p>
                )}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Tuition / Program Fee</span>
                  <span>₹{originalPrice?.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Institutional Scholarship</span>
                    <span>-₹{discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Study Material & Test Series</span>
                  <span className="text-emerald-600 font-bold">FREE INCLUDED</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#0B2545] border-t border-slate-100 pt-2">
                  <span>Total Payable</span>
                  <span className="text-base text-emerald-700">₹{currentPrice?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Guarantee badges */}
              <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-[#0B2545] space-y-1.5 border border-blue-100">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
                  <span>Verified Admission Guarantee</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[10.5px]">
                  Immediate enrollment receipt, student portal activation & live classroom access upon payment.
                </p>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 bg-[#0B2545] hover:bg-[#1E293B] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#F4B942]" />
                    <span>Confirm & Pay ₹{currentPrice?.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                🔒 256-Bit SSL Encrypted Razorpay Gateway Verification
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TuitionEnrollmentPage;
