import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { MessageSquareQuote, Search, Phone, Mail, CheckCircle2, Clock, X, Filter, RotateCcw } from 'lucide-react';

export const AdminEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('CONTACTED');
  const [counselorNote, setCounselorNote] = useState('');
  const { success, error: toastError } = useToast();

  const fetchEnquiries = async () => {
    try {
      const res = await adminService.getEnquiries({ limit: 50 });
      if (res.success && res.data) {
        setEnquiries(res.data.enquiries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedEnquiry) return;
    try {
      const res = await adminService.updateEnquiryStatus(selectedEnquiry._id, {
        status: statusUpdate,
        note: counselorNote,
      });
      if (res.success) {
        success('Enquiry lead updated successfully');
        setSelectedEnquiry(null);
        setCounselorNote('');
        fetchEnquiries();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update enquiry');
    }
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (e.fullName || '').toLowerCase();
        const email = (e.email || '').toLowerCase();
        const phone = (e.phone || '').toLowerCase();
        const course = (e.courseInterest || '').toLowerCase();
        const division = (e.division || '').toLowerCase();

        const matches =
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          course.includes(q) ||
          division.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }, [enquiries, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Enquiry Leads & Demo Registrations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track incoming demo requests, admissions inquiries, counselor notes, and follow-ups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 shadow-2xs outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New Leads</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant, phone, course..."
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
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
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Applicant</th>
                <th className="p-4 font-bold">Division & Program</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Mode & Timing</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEnquiries.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No enquiries match your search and filter criteria.
                  </td>
                </tr>
              )}
              {filteredEnquiries.map((enq) => (
                <tr key={enq._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-[#12356B]">
                    <div>{enq.fullName}</div>
                    <span className="text-[11px] text-slate-400 font-normal">{enq.phone} • {enq.email}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{enq.courseInterest}</div>
                    <span className="text-[10px] text-slate-400">{enq.division}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#1769D2]">
                      {enq.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {enq.preferredMode} • {enq.preferredSchedule}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      enq.status === 'NEW'
                        ? 'bg-rose-100 text-rose-800'
                        : enq.status === 'CONTACTED'
                        ? 'bg-blue-100 text-blue-800'
                        : enq.status === 'CONVERTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {enq.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setStatusUpdate(enq.status);
                      }}
                      className="bg-[#12356B] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0e2a56]"
                    >
                      Update Lead
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Enquiry Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-[#12356B] font-heading">
              Update Lead: {selectedEnquiry.fullName}
            </h3>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p><strong>Course:</strong> {selectedEnquiry.courseInterest}</p>
              <p><strong>Contact:</strong> {selectedEnquiry.phone} ({selectedEnquiry.email})</p>
              {selectedEnquiry.message && <p className="italic text-slate-500">"{selectedEnquiry.message}"</p>}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="CONVERTED">CONVERTED (ADMITTED)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Add Counselor Note</label>
                <textarea
                  rows={2}
                  value={counselorNote}
                  onChange={(e) => setCounselorNote(e.target.value)}
                  placeholder="e.g. Spoke to candidate. Shared Zoom demo invite for tomorrow 7:30 PM..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-bold shadow-md"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
