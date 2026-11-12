import React, { useState, useEffect, useMemo } from 'react';
import { adminService, courseService, examService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Plus, ShieldCheck, UserPlus, CheckCircle2, Search, X, Filter, RotateCcw } from 'lucide-react';

export const AdminPaymentsPage = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const { success, error: toastError } = useToast();

  const [grantForm, setGrantForm] = useState({
    studentId: '',
    itemType: 'COURSE',
    itemId: '',
    durationDays: 180,
    reason: 'Offline desk admission fee receipt verified',
  });

  const fetchData = async () => {
    try {
      const promises = [adminService.getAllPayments({ limit: 50 })];
      if (isAdmin) {
        promises.push(
          courseService.getCourses({ includeUnpublished: 'true', limit: 100 }),
          examService.getMockTests({ includeUnpublished: 'true', limit: 100 }),
          adminService.getStudents({ limit: 100 })
        );
      }

      const [payRes, courseRes, testRes, studentRes] = await Promise.all(promises);
      if (payRes?.success && payRes.data) setOrders(payRes.data.orders || []);
      if (courseRes?.success && courseRes.data) {
        setCourses(courseRes.data.courses || []);
        if (courseRes.data.courses?.length > 0 && !grantForm.itemId) {
          setGrantForm(prev => ({ ...prev, itemId: courseRes.data.courses[0]._id }));
        }
      }
      if (testRes?.success && testRes.data) {
        setMockTests(testRes.data.tests || []);
      }
      if (studentRes?.success && studentRes.data) {
        setStudents(studentRes.data.students || []);
        if (studentRes.data.students?.length > 0 && !grantForm.studentId) {
          setGrantForm(prev => ({ ...prev, studentId: studentRes.data.students[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.grantManualAccess(grantForm);
      if (res.success) {
        success('Course access granted manually to student!');
        setShowGrantModal(false);
        fetchData();
      }
    } catch (err) {
      toastError(err.message || 'Failed to grant access');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const studentName = (o.studentId?.name || '').toLowerCase();
        const studentEmail = (o.studentId?.email || '').toLowerCase();
        const receipt = (o.receiptNumber || '').toLowerCase();
        const razorpayId = (o.razorpayOrderId || '').toLowerCase();
        const programTitle = (o.itemId?.title || o.itemType || '').toLowerCase();

        const matches =
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          receipt.includes(q) ||
          razorpayId.includes(q) ||
          programTitle.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Payments Ledger & Access Grants
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review verified Razorpay transactions and grant manual course access for offline desk enrolments.
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Grant Manual Access
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid / Verified</option>
            <option value="PENDING">Pending / Created</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, receipt, order ID..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {(statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-[#12356B]">{filteredOrders.length}</span> of {orders.length} Transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Receipt / Order ID</th>
                <th className="p-4 font-bold">Program</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No transactions match your search and filter criteria.
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-[#12356B]">
                    <div>{order.studentId?.name || 'Student'}</div>
                    <span className="text-[11px] text-slate-400 font-normal">{order.studentId?.email}</span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-600">
                    {order.receiptNumber || order.razorpayOrderId}
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    {order.itemId?.title || order.itemType}
                  </td>
                  <td className="p-4 font-black text-emerald-700">₹{order.amount}</td>
                  <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      order.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Manual Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-[#12356B] font-heading">
              Grant Manual Course Entitlement
            </h3>

            <form onSubmit={handleGrantAccess} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  value={grantForm.studentId}
                  onChange={(e) => setGrantForm({ ...grantForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Grant Type *</label>
                <select
                  value={grantForm.itemType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const nextList = nextType === 'MOCK_TEST_PACKAGE' ? mockTests : courses;
                    setGrantForm({
                      ...grantForm,
                      itemType: nextType,
                      itemId: nextList[0]?._id || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="COURSE">Course / Tuition Program</option>
                  <option value="MOCK_TEST_PACKAGE">Mock Test Package</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {grantForm.itemType === 'MOCK_TEST_PACKAGE' ? 'Select Mock Test *' : 'Select Program *'}
                </label>
                <select
                  value={grantForm.itemId}
                  onChange={(e) => setGrantForm({ ...grantForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {(grantForm.itemType === 'MOCK_TEST_PACKAGE' ? mockTests : courses).map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title} (₹{item.fee ?? item.price ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Duration (Days)</label>
                <input
                  type="number"
                  value={grantForm.durationDays}
                  onChange={(e) => setGrantForm({ ...grantForm, durationDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Trail Reason *</label>
                <input
                  type="text"
                  required
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-bold shadow-md"
                >
                  Grant Enrolment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
