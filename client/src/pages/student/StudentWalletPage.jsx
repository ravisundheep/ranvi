import React, { useState, useEffect } from 'react';
import { walletService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Wallet,
  Gift,
  Share2,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const StudentWalletPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await walletService.getMyWallet();
      if (res?.success && res.data) {
        setWalletData(res.data);
        if (res.data.payoutDetails) {
          setPaymentDetails((prev) => ({
            ...prev,
            ...res.data.payoutDetails,
          }));
        }
      }
    } catch (err) {
      toastError(err.message || 'Failed to load wallet information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const referralCode = walletData?.referralCode || user?.referralCode || 'RANVI';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 500) {
      toastError('Minimum payout withdrawal amount is ₹500');
      return;
    }
    if (amountNum > (walletData?.walletBalance || 0)) {
      toastError(`Amount exceeds your available wallet balance (₹${walletData?.walletBalance || 0})`);
      return;
    }

    try {
      setSubmittingPayout(true);
      const res = await walletService.requestPayout({
        amount: amountNum,
        payoutMethod,
        paymentDetails,
      });
      if (res?.success) {
        success('Payout withdrawal request submitted successfully!');
        setPayoutModalOpen(false);
        setPayoutAmount('');
        fetchWallet();
      }
    } catch (err) {
      toastError(err.message || 'Failed to submit payout request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading && !walletData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading your wallet & rewards ledger...</p>
      </div>
    );
  }

  const balance = walletData?.walletBalance || 0;
  const stats = walletData?.stats || {};
  const transactions = walletData?.transactions || [];
  const payoutRequests = walletData?.payoutRequests || [];

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6 max-w-5xl w-full">
      {/* Page Header */}
      <div className="shrink-0 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B2545] font-serif flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#1769D2]" /> Student Wallet & Refer & Earn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Single-level direct referral rewards, transparent earnings ledger, and fast bank/UPI payouts.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setPayoutModalOpen(true)}
          disabled={balance < 500}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          Request Payout (Min ₹500)
        </button>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none space-y-6 pr-1">
      {/* Refer & Earn Share Banner */}
      <div className="bg-gradient-to-r from-[#0B2545] via-[#12356B] to-[#1769D2] text-white p-6 sm:p-7 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Single-Level Direct Referral Reward
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-serif leading-tight">
            Invite Friends & Banking Aspirants to Ranvi Institutions
          </h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            Earn a fixed <strong>₹100 reward</strong> on their first paid course enrolment. Multi-level or pyramid structures are strictly forbidden; rewards are verified by Admin/Finance before moving to Available Balance.
          </p>

          {/* Referral Code Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/25 flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase font-bold text-blue-200">Your Referral Code:</span>
              <span className="font-mono font-black text-sm tracking-widest text-amber-300">{referralCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#0B2545] hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Join Ranvi Institutions using my referral link and start your exam preparation: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>
        {referralLink && (
          <div className="bg-white p-2.5 rounded-2xl shadow-md flex flex-col items-center gap-1 self-start md:self-center shrink-0 relative z-10">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(referralLink)}`}
              alt="Referral QR Code"
              className="w-24 h-24 rounded-lg"
            />
            <span className="text-[10px] font-bold text-[#0B2545] uppercase tracking-wider">Scan to Join</span>
          </div>
        )}
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Available Balance</span>
          <div className="text-2xl font-black text-emerald-600 font-serif">₹{balance.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-400">Available for payout (min ₹500)</p>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Rewards</span>
          <div className="text-2xl font-black text-amber-700 font-serif">₹{(stats.pendingRewards || 0).toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-amber-700/80">Awaiting admin verification</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Rewards Earned</span>
          <div className="text-2xl font-black text-[#0B2545] font-serif">₹{(stats.totalEarned || 0).toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-400">Lifetime referral credits</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Friends Invited</span>
          <div className="text-2xl font-black text-[#1769D2] font-serif">{stats.referredCount || 0}</div>
          <p className="text-[10px] text-slate-400">Enrolled through your link</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Paid Out</span>
          <div className="text-2xl font-black text-slate-800 font-serif">₹{(stats.totalWithdrawn || 0).toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-400">Successfully disbursed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Ledger Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Complete Wallet Ledger
            </h3>
            <span className="text-[10.5px] font-bold text-slate-500">{transactions.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No wallet transactions recorded yet. Invite friends using your referral code above to start earning!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Date & ID</th>
                    <th className="p-3.5">Source / Activity</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-slate-700">{t.transactionId}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 text-[11px]">{t.description || t.source}</div>
                        <span className="text-[10px] text-slate-400">{t.source.replace('_', ' ')}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`font-black text-xs inline-flex items-center gap-0.5 ${
                          t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                        ₹{t.balanceAfter}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : t.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payout Requests History */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" /> Payout Requests
            </h3>
            <span className="text-[10.5px] font-bold text-slate-500">{payoutRequests.length} Requests</span>
          </div>

          <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
            {payoutRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No payout requests requested yet.
              </p>
            ) : (
              payoutRequests.map((p) => (
                <div key={p._id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700">{p.payoutId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      p.status === 'PROCESSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : p.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>Withdrawal Amount:</span>
                    <span className="font-black text-sm text-[#0B2545]">₹{p.amount}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Method: {p.payoutMethod === 'UPI' ? `UPI (${p.paymentDetails?.upiId})` : `Bank A/C (${p.paymentDetails?.bankAccountNumber})`}
                  </div>

                  {p.referenceNumber && (
                    <div className="text-[10.5px] bg-emerald-50 text-emerald-800 p-1.5 rounded font-mono">
                      UTR / Bank Ref: {p.referenceNumber}
                    </div>
                  )}

                  {p.adminNote && (
                    <div className={`text-[10.5px] p-1.5 rounded ${
                      p.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {p.status === 'REJECTED' ? 'Reason: ' : 'Status / Delay Note: '}{p.adminNote}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
                    <span>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {p.status === 'PENDING' && <span className="text-amber-600 font-semibold">SLA: 7 Working Days</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Payout Request Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0B2545] font-serif">
              Request Wallet Payout Withdrawal
            </h3>
            <p className="text-xs text-slate-500">
              Minimum withdrawal is ₹500. Funds will be disbursed to your verified bank account or UPI ID within <strong className="text-slate-700">7 working days</strong>.
            </p>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Withdrawal Amount (₹) <span className="text-slate-400 font-normal">(Available: ₹{balance})</span>
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  max={balance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Min ₹500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('UPI')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      payoutMethod === 'UPI'
                        ? 'border-[#0B2545] bg-[#0B2545] text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('BANK_TRANSFER')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      payoutMethod === 'BANK_TRANSFER'
                        ? 'border-[#0B2545] bg-[#0B2545] text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Bank Transfer
                  </button>
                </div>
              </div>

              {payoutMethod === 'UPI' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    required
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                    placeholder="e.g. mobileNumber@upi or name@okaxis"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={paymentDetails.accountHolderName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, accountHolderName: e.target.value })}
                      placeholder="Name as per passbook"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails.bankAccountNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankAccountNumber: e.target.value })}
                        placeholder="Bank A/C number"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={paymentDetails.ifscCode}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="11 chars"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="py-2.5 px-4 rounded-xl bg-[#0B2545] text-white font-bold hover:bg-[#1E293B] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingPayout ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWalletPage;
