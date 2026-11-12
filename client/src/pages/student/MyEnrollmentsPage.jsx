import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../../services';
import {
  Receipt,
  GraduationCap,
  Calendar,
  Clock,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CreditCard,
  User,
} from 'lucide-react';

export const MyEnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const res = await enrollmentService.getMyEnrollments();
        if (isMounted && res?.success && res.data) {
          setEnrollments(Array.isArray(res.data) ? res.data : res.data.enrollments || []);
        }
      } catch (err) {
        console.error('Failed to load my enrollments', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEnrollments();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEnrollments = enrollments.filter((e) => {
    if (statusFilter === 'ALL') return true;
    return e.enrollmentStatus === statusFilter;
  });

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif">
            My Program Enrollments & Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your official admissions, batch timings, payment confirmations, and download receipts.
          </p>
        </div>
        <Link
          to="/student/available-programs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4 text-[#F4B942]" />
          Browse More Programs
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'ENROLLED', 'ACTIVE', 'PENDING_PAYMENT', 'CANCELLED', 'REFUNDED', 'EXPIRED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === st
                ? 'bg-[#0B2545] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Enrollments' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Enrollments Table / Cards */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading your enrollments...</p>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No enrollment records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't enrolled in any tuition or coaching programs yet. Explore our top programs to get started.
          </p>
          <Link
            to="/student/available-programs"
            className="inline-block mt-2 px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#1E293B]"
          >
            Browse Available Programs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map((enr) => {
            const course = enr.courseId || {};
            const isEnrolled = enr.enrollmentStatus === 'ENROLLED';
            const isPaid = enr.paymentStatus === 'PAID';

            return (
              <div
                key={enr._id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {enr.enrollmentId}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isEnrolled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {enr.enrollmentStatus}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isPaid ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {enr.paymentStatus}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    {course.title || 'Tuition & Coaching Program'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {enr.preferredBatch || enr.batchTiming || 'Standard Batch'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(enr.enrolledAt || enr.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{(enr.finalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(enr)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#1769D2]" />
                    <span>View Receipt</span>
                  </button>

                  {course.slug && (
                    <Link
                      to={`/tuition-programs/${course.slug}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Program Hub</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Receipt Modal Popup */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#1769D2]" />
                <h3 className="text-sm font-black text-[#0B2545]">
                  Official Enrollment Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              <div className="text-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-[#0B2545] tracking-tight">RANVI INSTITUTIONS</h2>
                <p className="text-[11px] text-slate-500">Excellence in Coaching & Professional Guidance</p>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono font-bold">
                  {selectedReceipt.enrollmentId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Program</span>
                  <p className="font-bold text-slate-900">
                    {selectedReceipt.courseId?.title || 'Tuition & Coaching'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Batch Schedule</span>
                  <p className="font-bold text-slate-900">
                    {selectedReceipt.preferredBatch || selectedReceipt.batchTiming || 'Standard Batch'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Student Name</span>
                  <p className="font-bold text-slate-900">
                    {selectedReceipt.studentName || selectedReceipt.studentDetails?.name || 'Enrolled Student'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedReceipt.studentEmail || selectedReceipt.studentDetails?.email}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Admission Date</span>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedReceipt.enrolledAt || selectedReceipt.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 text-slate-700">Tuition & Coaching Program Fee</td>
                      <td className="p-2.5 text-right font-medium">₹{(selectedReceipt.feeAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {selectedReceipt.discountAmount > 0 && (
                      <tr>
                        <td className="p-2.5 text-emerald-600">Institutional Scholarship Discount</td>
                        <td className="p-2.5 text-right text-emerald-600 font-medium">-₹{(selectedReceipt.discountAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50/80 font-black text-slate-900">
                      <td className="p-2.5">Total Amount Paid</td>
                      <td className="p-2.5 text-right text-emerald-700 font-black">
                        ₹{(selectedReceipt.finalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Verification Stamp */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs">Authorized Digital Receipt</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                  STATUS: {selectedReceipt.paymentStatus}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs print:hidden">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B2545] text-white font-bold hover:bg-[#1E293B] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEnrollmentsPage;
