import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { MessageSquareQuote, Search, Phone, Mail, CheckCircle2, Clock, X, Filter, RotateCcw } from 'lucide-react';

export const AdminEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('CONTACTED');
  const [counselorNote, setCounselorNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignedRole, setAssignedRole] = useState('STAFF');
  const { success, error: toastError } = useToast();

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await adminService.getEnquiries({ limit: 100 });
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
        resolutionNote: resolutionNote,
      });
      if (res.success) {
        success('Request / enquiry lead updated successfully');
        setSelectedEnquiry(null);
        setCounselorNote('');
        setResolutionNote('');
        fetchEnquiries();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update enquiry');
    }
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
      if (divisionFilter !== 'ALL' && e.division !== divisionFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const reqId = (e.requestId || '').toLowerCase();
        const name = (e.fullName || '').toLowerCase();
        const email = (e.email || '').toLowerCase();
        const phone = (e.phone || '').toLowerCase();
        const course = (e.courseInterest || '').toLowerCase();
        const division = (e.division || '').toLowerCase();

        const matches =
          reqId.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          course.includes(q) ||
          division.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }, [enquiries, statusFilter, typeFilter, divisionFilter, searchQuery]);

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Enquiry Leads & Demo Registrations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track incoming demo requests, admissions inquiries, counselor notes, and follow-ups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 shadow-2xs outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Types</option>
            <option value="CAREER_GUIDANCE">Career Guidance</option>
            <option value="SUPPORT_TICKET">Support Ticket</option>
            <option value="DEMO_CLASS">Demo Class</option>
            <option value="COUNSELING">Counseling</option>
            <option value="OFFLINE_ADMISSION">Offline Admission</option>
            <option value="GENERAL">General Enquiry</option>
          </select>

          {/* Division Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 shadow-2xs outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Divisions</option>
            <option value="BANKERS_PATH">Banker's Path</option>
            <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
            <option value="ENTRANCE_EXAMS">Entrance Exams</option>
            <option value="TUITIONS">Tuition Programs</option>
            <option value="GENERAL">General</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 shadow-2xs outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ANSWERED">Answered / Resolved</option>
            <option value="NEW">New Leads</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow Up</option>
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
              placeholder="Search ID, applicant, course..."
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

          {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || divisionFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                setDivisionFilter('ALL');
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
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
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
                    <div className="flex items-center gap-2">
                      <span>{enq.fullName}</span>
                      {enq.requestId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {enq.requestId}
                        </span>
                      )}
                      {enq.priority && enq.priority !== 'MEDIUM' && (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          enq.priority === 'URGENT' || enq.priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {enq.priority}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5 flex flex-wrap items-center gap-2">
                      <span>📞 {enq.phone}</span>
                      {enq.whatsappNumber && <span>💬 WA: {enq.whatsappNumber}</span>}
                      <span>✉️ {enq.email}</span>
                      {enq.requestACall && (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded text-[10px] font-bold">
                          Requested Call
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{enq.courseInterest}</div>
                    <span className="text-[10px] text-slate-400">{enq.division?.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      enq.type === 'CAREER_GUIDANCE'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : enq.type === 'SUPPORT_TICKET'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-[#1769D2]'
                    }`}>
                      {enq.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {enq.preferredMode} • {enq.preferredSchedule}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      enq.status === 'ANSWERED' || enq.status === 'CONVERTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : enq.status === 'IN_PROGRESS' || enq.status === 'CONTACTED'
                        ? 'bg-blue-100 text-blue-800'
                        : enq.status === 'PENDING' || enq.status === 'NEW'
                        ? 'bg-amber-100 text-amber-800'
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
                        setResolutionNote(enq.resolutionNote || '');
                      }}
                      className="bg-[#12356B] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0e2a56] cursor-pointer"
                    >
                      Update / Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Update Enquiry Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#12356B] font-heading flex items-center justify-between">
              <span>Request / Lead Details</span>
              {selectedEnquiry.requestId && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedEnquiry.requestId}
                </span>
              )}
            </h3>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <p><strong>Applicant:</strong> {selectedEnquiry.fullName} ({selectedEnquiry.email})</p>
              <p><strong>Mobile:</strong> {selectedEnquiry.phone} {selectedEnquiry.whatsappNumber ? `| WhatsApp: ${selectedEnquiry.whatsappNumber}` : ''}</p>
              <p><strong>Program / Course:</strong> {selectedEnquiry.courseInterest} ({selectedEnquiry.division})</p>
              {selectedEnquiry.qualification && (
                <p><strong>Qualification:</strong> {selectedEnquiry.qualification}</p>
              )}
              {selectedEnquiry.careerGoals && (
                <p><strong>Career Goals:</strong> {selectedEnquiry.careerGoals}</p>
              )}
              {selectedEnquiry.message && (
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-slate-600">Student Message:</span>
                  <p className="italic text-slate-700 mt-0.5 whitespace-pre-line">"{selectedEnquiry.message}"</p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ANSWERED">ANSWERED / RESOLVED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="CONVERTED">CONVERTED (ADMITTED)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Guidance / Resolution Note (Visible to Student)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Official counselor answer or resolution advice for the student..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Staff Note (Private)</label>
                <textarea
                  rows={2}
                  value={counselorNote}
                  onChange={(e) => setCounselorNote(e.target.value)}
                  placeholder="e.g. Spoke to candidate. Shared Zoom demo invite or study plan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {selectedEnquiry.adminNotes && selectedEnquiry.adminNotes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-500 block mb-1">Previous Notes History:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedEnquiry.adminNotes.map((an, i) => (
                      <div key={i} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-600">
                        <span className="font-semibold text-slate-800">{an.addedBy}: </span>
                        {an.note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-bold shadow-md cursor-pointer hover:bg-[#0e2a56]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
