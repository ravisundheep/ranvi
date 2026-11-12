import React, { useState, useEffect } from 'react';
import { walletService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RotateCcw,
  ExternalLink,
  Smartphone,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

export const AdminPayoutsPage = () => {
  const { success, error: toastError } = useToast();

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Action Modal State
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [actionType, setActionType] = useState('PROCESSED'); // 'PROCESSED', 'REJECTED', 'APPROVED'
  const [referenceNumber, setReferenceNumber] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await walletService.getAdminPayouts({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res?.success && res.data) {
        setPayouts(res.data.payouts || []);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const openProcessModal = (payout, type) => {
    setSelectedPayout(payout);
    setActionType(type);
    setReferenceNumber('');
    setAdminNote(type === 'REJECTED' ? 'Bank details invalid' : 'Disbursed via IMPS/UPI');
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (actionType === 'PROCESSED' && !referenceNumber.trim()) {
      toastError('Bank UTR or transaction reference number is mandatory for disbursement');
      return;
    }

    try {
      setProcessing(true);
      const res = await walletService.processAdminPayout(selectedPayout._id, {
        status: actionType,
        referenceNumber: referenceNumber.trim(),
        adminNote: adminNote.trim(),
      });
      if (res?.success) {
        success(`Payout request ${actionType.toLowerCase()} successfully`);
        setSelectedPayout(null);
        fetchPayouts();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update payout request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const pid = (p.payoutId || '').toLowerCase();
    const name = (p.userId?.name || '').toLowerCase();
    const sid = (p.userId?.studentId || '').toLowerCase();
    const upi = (p.paymentDetails?.upiId || '').toLowerCase();
    const acc = (p.paymentDetails?.bankAccountNumber || '').toLowerCase();
    return pid.includes(q) || name.includes(q) || sid.includes(q) || upi.includes(q) || acc.includes(q);
  });

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Student Referral Payouts & Disbursements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process student reward withdrawals, verify UPI/bank details, enter UTR references, and handle refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, ID, UPI, or A/C..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading payout requests...</p>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No payout requests found</h3>
          <p className="text-xs text-slate-400 mt-1">Pending reward withdrawals will show up here for finance review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Payout ID & Student</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Method & Destination</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">UTR / Reference</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 block">{p.payoutId}</span>
                        <div className="font-semibold text-slate-800">{p.userId?.name || 'Student'}</div>
                        <span className="text-[10px] text-slate-400">
                          {p.userId?.studentId} • {p.userId?.phone}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-sm font-black text-[#0B2545]">₹{p.amount}</span>
                    </td>
                    <td className="p-3.5">
                      {p.payoutMethod === 'UPI' ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#1769D2]">UPI</span>
                          <div className="font-mono font-bold text-slate-800 text-[11px]">{p.paymentDetails?.upiId}</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">BANK TRANSFER</span>
                          <div className="font-mono text-[11px] text-slate-800">
                            A/C: {p.paymentDetails?.bankAccountNumber}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            IFSC: {p.paymentDetails?.ifscCode} • {p.paymentDetails?.accountHolderName}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
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
                    </td>
                    <td className="p-3.5">
                      {p.referenceNumber ? (
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {p.referenceNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {p.status === 'PENDING' || p.status === 'APPROVED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openProcessModal(p, 'PROCESSED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Disburse / Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => openProcessModal(p, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Process Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0B2545] font-serif">
              {actionType === 'PROCESSED' ? 'Mark Payout as Disbursed' : 'Reject Payout Request & Refund'}
            </h3>
            <p className="text-xs text-slate-500">
              Payout ID: <span className="font-mono font-bold text-slate-800">{selectedPayout.payoutId}</span> (₹{selectedPayout.amount} for {selectedPayout.userId?.name})
            </p>

            <form onSubmit={handleProcessSubmit} className="space-y-4 text-xs">
              {actionType === 'PROCESSED' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bank UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 423985729183 or IMPS-89234"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {actionType === 'REJECTED' ? 'Reason for Rejection (Visible to Student)' : 'Internal Finance Note'}
                </label>
                <textarea
                  rows={2}
                  required={actionType === 'REJECTED'}
                  placeholder={actionType === 'REJECTED' ? 'e.g. Invalid IFSC code or inactive account' : 'e.g. Processed via HDFC Corporate Netbanking'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`py-2.5 px-4 rounded-xl font-bold text-white shadow-xs cursor-pointer disabled:opacity-50 ${
                    actionType === 'PROCESSED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processing ? 'Processing...' : actionType === 'PROCESSED' ? 'Confirm Disbursement' : 'Reject & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayoutsPage;
