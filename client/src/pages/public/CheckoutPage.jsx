import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { courseService, examService, paymentService } from '../../services';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  BookOpen,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const itemType = searchParams.get('type') || 'COURSE';
  const itemId = searchParams.get('id');

  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/checkout?type=${itemType}&id=${itemId}` } });
      return;
    }

    const fetchItem = async () => {
      try {
        if (itemType === 'COURSE' && itemId) {
          const res = await courseService.getCourseBySlug(itemId);
          if (res?.success && res.data) {
            const courseData = res.data.course || res.data;
            setItem(courseData);
            if (Array.isArray(courseData.subscriptionPlans) && courseData.subscriptionPlans.length > 0) {
              setSelectedPlan(courseData.subscriptionPlans[0]);
            }
          }
        } else if (itemType === 'MOCK_TEST_PACKAGE' && itemId) {
          const res = await examService.getMockTestBySlug(itemId);
          if (res?.success && res.data) {
            setItem(res.data.test || res.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [isAuthenticated, itemId, itemType, navigate]);

  const handlePayNow = async () => {
    if (!item) return;
    setProcessing(true);

    try {
      const activeFee = selectedPlan ? selectedPlan.price : (itemType === 'COURSE' ? item.fee : (item.price || 399));
      // 1. Create order on backend
      const orderRes = await paymentService.createCheckoutOrder({
        itemType,
        itemId: item._id,
        amount: activeFee,
        durationMonths: selectedPlan ? selectedPlan.durationMonths : null,
        useWallet,
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Could not initiate checkout');
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = orderRes.data;

      // If price is 0 (Free access)
      if (orderRes.data.isFree) {
        success('Free access activated! Welcome to your program.');
        navigate('/student/my-courses');
        setProcessing(false);
        return;
      }

      // Require authentic Razorpay Checkout SDK
      if (!window.Razorpay) {
        toastError('Razorpay payment gateway could not load. Please refresh the page and check your network connection.');
        setProcessing(false);
        return;
      }

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'Ranvi Institutions',
        description: `Enrolment for ${item.title}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#12356B',
        },
        handler: async function (response) {
          // Authoritative server-side verification
          try {
            const verifyRes = await paymentService.verifyPayment({
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              success('Payment verified! Your access is now active.');
              navigate(itemType === 'MOCK_TEST_PACKAGE' ? '/student/mock-tests' : '/student/my-courses');
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
      toastError(err.message || 'Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h3 className="text-lg font-bold text-[#12356B]">No Program Selected</h3>
        <p className="text-xs text-slate-600">Please choose a course or mock test package to proceed.</p>
        <Link to="/bankers-path" className="inline-block bg-[#12356B] text-white px-5 py-2 rounded-xl text-xs font-bold">
          Explore Courses
        </Link>
      </div>
    );
  }

  const rawFee = selectedPlan ? selectedPlan.price : (itemType === 'COURSE' ? item.fee : (item.price || 399));
  const walletBalance = user?.walletBalance || 0;
  const walletDeduction = useWallet ? Math.min(rawFee, walletBalance) : 0;
  const fee = Math.max(0, rawFee - walletDeduction);

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-[#1769D2] bg-[#EAF3FF] px-3.5 py-1 rounded-full uppercase tracking-wider">
            256-Bit SSL Encrypted Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12356B] font-heading">
            Review Order & Payment
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Order Details */}
          <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-extrabold text-[#1769D2] uppercase tracking-wider">
                {itemType === 'COURSE' ? 'Full Certification Program' : 'Online Model Paper Package'}
              </span>
              <h3 className="text-lg font-bold text-[#12356B] font-heading mt-1">
                {item.title}
              </h3>
            </div>

            {/* Subscription Duration Selection */}
            {Array.isArray(item.subscriptionPlans) && item.subscriptionPlans.length > 0 && (
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2.5">
                <span className="text-[11px] font-black text-[#12356B] uppercase tracking-wider block">
                  Select Subscription Duration:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {item.subscriptionPlans.map((plan, idx) => {
                    const isSelected = selectedPlan?.durationMonths === plan.durationMonths;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#1769D2] ring-2 ring-[#1769D2]/30 shadow-xs'
                            : 'bg-white/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#12356B]">
                          {plan.label || `${plan.durationMonths} Months`}
                        </div>
                        <div className="text-sm font-black text-[#1769D2] mt-0.5">
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

            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Immediate access to Live Zoom Classes & HD Recordings</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10–20 Full Length Online Model Test Papers</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Downloadable Study Notes & Formula Sheets</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Validity: <strong>{item.validityDays || 180} Days</strong> from date of purchase</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Student</span>
              <p className="font-bold text-[#12356B]">{user?.name} ({user?.email})</p>
              <p className="text-slate-500 font-medium">Contact: {user?.phone}</p>
            </div>
          </div>

          {/* Pricing & Razorpay Action */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#12356B] uppercase tracking-wider pb-2 border-b border-slate-100">
                Payment Summary
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Program Fee</span>
                  <span className="font-bold">₹{rawFee?.toLocaleString('en-IN')}</span>
                </div>
                {walletBalance > 0 && (
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-bold text-emerald-900">Apply Wallet Balance</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700">₹{walletBalance}</span>
                  </label>
                )}
                {walletDeduction > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Wallet Balance Applied</span>
                    <span>-₹{walletDeduction?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Included)</span>
                  <span className="font-bold">₹0.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Digital Portal Access</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-[#12356B]">Total Payable</span>
                  <span className="text-2xl font-black text-[#12356B]">₹{fee?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-[#12356B]/20 disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#F4B942]" />
                {processing ? 'Processing Payment...' : fee === 0 ? 'Activate Course with Wallet' : `Pay ₹${fee} via Razorpay`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPI, Cards, NetBanking & Wallets Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
