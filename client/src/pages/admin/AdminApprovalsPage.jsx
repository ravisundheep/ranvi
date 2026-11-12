import React, { useState, useEffect } from 'react';
import { staffService, courseService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, Clock, X } from 'lucide-react';

export const AdminApprovalsPage = () => {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [proposalForm, setProposalForm] = useState({
    requestType: 'FEE_CHANGE',
    courseId: '',
    proposedFee: 0,
    reason: '',
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [appRes, courseRes] = await Promise.all([
        staffService.getApprovals({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
        courseService.getCourses({ includeUnpublished: 'true', limit: 100 }),
      ]);
      if (appRes?.success && appRes.data) {
        setRequests(appRes.data.approvals || []);
      }
      if (courseRes?.success && courseRes.data) {
        const list = courseRes.data.courses || [];
        setCourses(list);
        if (list.length > 0 && !proposalForm.courseId) {
          setProposalForm((p) => ({ ...p, courseId: list[0]._id, proposedFee: list[0].fee || 0 }));
        }
      }
    } catch (err) {
      toastError(err.message || 'Failed to load approvals queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    const targetCourse = courses.find((c) => c._id === proposalForm.courseId);
    if (!targetCourse) return;

    try {
      const res = await staffService.createApproval({
        requestType: 'FEE_CHANGE',
        resourceModel: 'Course',
        resourceId: targetCourse._id,
        targetTitle: targetCourse.title,
        payload: { fee: Number(proposalForm.proposedFee) },
        reason: proposalForm.reason,
      });
      if (res?.success) {
        success('Fee change proposal submitted for Admin/Super Admin approval');
        setCreateOpen(false);
        setProposalForm((p) => ({ ...p, reason: '' }));
        fetchApprovals();
      }
    } catch (err) {
      toastError(err.message || 'Failed to submit proposal');
    }
  };

  const handleReview = async (id, decision) => {
    const note = window.prompt(`Optional review remarks for ${decision}:`) || '';
    try {
      const res = await staffService.reviewApproval(id, decision, note);
      if (res?.success) {
        success(`Request ${decision.toLowerCase()} successfully`);
        fetchApprovals();
      }
    } catch (err) {
      toastError(err.message || 'Review action failed');
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#1769D2]" /> Maker-Checker Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dual-control audit workflow for fee updates, discount overrides, refunds, and manual entitlements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#F4B942]" /> Submit Fee Proposal
        </button>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              statusFilter === st
                ? 'bg-[#0B1E3D] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Request Type & Target</th>
                <th className="p-4 font-bold">Proposed Change</th>
                <th className="p-4 font-bold">Reason</th>
                <th className="p-4 font-bold">Submitted By</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    Loading approval queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No approval requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-[#1769D2]">
                        {req.requestType}
                      </span>
                      <p className="font-bold text-[#12356B] mt-1">{req.targetTitle || req.resourceModel}</p>
                    </td>
                    <td className="p-4 font-mono text-[11px] font-bold text-slate-700">
                      {JSON.stringify(req.payload)}
                    </td>
                    <td className="p-4 max-w-xs">{req.reason}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{req.requestedBy?.name || 'Staff'}</p>
                      <p className="text-[10.5px] text-slate-400">{req.requestedRole}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : req.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      {req.status === 'PENDING' && isAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReview(req._id, 'APPROVED')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(req._id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10.5px] text-slate-400">
                          {req.reviewedBy?.name ? `By ${req.reviewedBy.name}` : 'Awaiting Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Proposal Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#12356B]">Submit Course Fee Change Proposal</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course / Tuition Program</label>
                <select
                  value={proposalForm.courseId}
                  onChange={(e) => {
                    const c = courses.find((x) => x._id === e.target.value);
                    setProposalForm({ ...proposalForm, courseId: e.target.value, proposedFee: c?.fee ?? 0 });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title} (Current: ₹{c.fee})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Proposed New Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={proposalForm.proposedFee}
                  onChange={(e) => setProposalForm({ ...proposalForm, proposedFee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Justification Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={proposalForm.reason}
                  onChange={(e) => setProposalForm({ ...proposalForm, reason: e.target.value })}
                  placeholder="e.g. Scholarship batch pricing adjustment approved by Dean"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-[#0B1E3D] font-bold text-white cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
