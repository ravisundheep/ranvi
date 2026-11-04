import React, { useState, useEffect } from 'react';
import { enrollmentService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Receipt,
  Printer,
  ChevronRight,
  Eye,
  Edit2,
  X,
  CreditCard,
  DollarSign,
  GraduationCap,
} from 'lucide-react';

export const AdminEnrollmentsPage = () => {
  const { success, error: toastError } = useToast();

  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    enrolledCount: 0,
    pendingCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Detail & Status Modal State
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('ENROLLED');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollRes, statsRes] = await Promise.allSettled([
        enrollmentService.getAdminEnrollments({
          search: search || undefined,
          enrollmentStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
          paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
          limit: 50,
        }),
        enrollmentService.getAdminEnrollmentStats(),
      ]);

      if (enrollRes.status === 'fulfilled' && enrollRes.value?.success) {
        const d = enrollRes.value.data;
        setEnrollments(Array.isArray(d) ? d : d.enrollments || []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data || {});
      }
    } catch (err) {
      toastError(err.message || 'Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, paymentFilter]);

  // Handle Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    try {
      setUpdating(true);
      const res = await enrollmentService.updateAdminEnrollmentStatus(selectedEnrollment._id, {
        enrollmentStatus: newStatus,
        notes: statusNotes,
      });

      if (res?.success) {
        success('Enrollment status successfully updated');
        setEditStatusModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update enrollment status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Student Enrollments & Admissions Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student applications, verify online payments, track batch allotments, and issue digital receipts.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Applications</span>
            <p className="text-xl font-black text-slate-900">{stats.totalEnrollments || enrollments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Confirmed Enrolled</span>
            <p className="text-xl font-black text-emerald-600">{stats.enrolledCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Verification</span>
            <p className="text-xl font-black text-amber-600">{stats.pendingCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Fee Collected</span>
            <p className="text-xl font-black text-[#0B2545]">
              ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#0B2545] flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, phone, email, enrollment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="ALL">All Enrollment Status</option>
            <option value="ENROLLED">Enrolled (Active)</option>
            <option value="SUSPENDED">Suspended (Access Paused)</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAYMENT_PENDING_VERIFICATION">Pending Verification</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="ALL">All Payment Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading student enrollments...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No enrollment records found</h3>
          <p className="text-xs text-slate-400 mt-1">Applications and admissions will appear here when students enroll.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Enrollment ID</th>
                  <th className="p-3.5">Student Info</th>
                  <th className="p-3.5">Program & Batch</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Enrollment Status</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enr) => {
                  const student = enr.studentDetails || enr.studentId || {};
                  const course = enr.courseId || {};
                  const isEnrolled = enr.enrollmentStatus === 'ENROLLED';
                  const isPaid = enr.paymentStatus === 'PAID';

                  return (
                    <tr key={enr._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] font-bold text-slate-600 whitespace-nowrap">
                        {enr.enrollmentId}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{student.name || 'Student'}</p>
                          <p className="text-[11px] text-slate-500">{student.email}</p>
                          {student.phone && (
                            <p className="text-[10.5px] text-slate-400">📱 {student.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5 max-w-xs">
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {course.title || 'Tuition Program'}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            Batch: {enr.batchTiming || 'Standard'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-black text-slate-900">
                          ₹{(enr.finalAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isEnrolled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {enr.enrollmentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {enr.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEnrollment(enr);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEnrollment(enr);
                              setNewStatus(enr.enrollmentStatus);
                              setStatusNotes(enr.notes || '');
                              setEditStatusModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Update Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {editStatusModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">
                Update Enrollment Status
              </h3>
              <button
                type="button"
                onClick={() => setEditStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Enrollment</span>
                <p className="font-bold text-slate-900">{selectedEnrollment.enrollmentId}</p>
                <p className="text-slate-600">{selectedEnrollment.studentDetails?.name} • {selectedEnrollment.courseId?.title}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Enrollment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-[#1769D2]"
                >
                  <option value="ENROLLED">ENROLLED (Confirmed & Active)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Suspend Access)</option>
                  <option value="CANCELLED">CANCELLED (Revoke Admission)</option>
                  <option value="REFUNDED">REFUNDED (Payment Refunded & Access Revoked)</option>
                  <option value="EXPIRED">EXPIRED (Subscription Term Finished)</option>
                  <option value="PAYMENT_PENDING_VERIFICATION">PAYMENT PENDING VERIFICATION</option>
                  <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrative Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Verified bank NEFT transfer, batch assigned..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditStatusModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-[#0B2545] text-white font-bold hover:bg-[#1E293B] disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {receiptModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <h3 className="text-sm font-black text-slate-900">
                Enrollment Receipt
              </h3>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-[#0B2545]">RANVI INSTITUTIONS</h2>
                <p className="text-[11px] text-slate-500">Official Student Admission Record</p>
                <span className="inline-block mt-2 font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg">
                  {selectedEnrollment.enrollmentId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Student Name</span>
                  <p className="font-bold text-slate-900">{selectedEnrollment.studentDetails?.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedEnrollment.studentDetails?.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Contact Phone</span>
                  <p className="font-bold text-slate-900">{selectedEnrollment.studentDetails?.phone || '—'}</p>
                  <p className="text-[10px] text-slate-500">Guardian: {selectedEnrollment.studentDetails?.parentName || '—'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Program</span>
                  <p className="font-bold text-slate-900">{selectedEnrollment.courseId?.title}</p>
                  <p className="text-[10px] text-slate-500">Batch: {selectedEnrollment.batchTiming}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment / Fee</span>
                  <p className="font-black text-emerald-700 text-sm">₹{(selectedEnrollment.finalAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500">Status: {selectedEnrollment.paymentStatus}</p>
                </div>
              </div>

              {selectedEnrollment.studentDetails?.address && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Residential Address</span>
                  <p className="text-slate-800">{selectedEnrollment.studentDetails.address}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs print:hidden">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
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
                Print Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
