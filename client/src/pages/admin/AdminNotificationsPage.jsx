import React, { useState, useEffect } from 'react';
import { publicNotificationService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Pin,
  Calendar,
  X,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';

export const AdminNotificationsPage = () => {
  const { success, error: toastError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    description: '',
    type: 'ANNOUNCEMENT',
    category: 'GENERAL',
    organization: '',
    postName: '',
    vacancies: '',
    qualification: '',
    ageLimit: '',
    applicationStartDate: '',
    applicationEndDate: '',
    applyOnlineUrl: '',
    officialNotificationPdfUrl: '',
    targetAudience: 'ALL',
    isPublic: true,
    actionUrl: '',
    status: 'PUBLISHED',
    isPinned: false,
    publishedAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await publicNotificationService.getAdminNotifications({
        search: search || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res?.success && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : res.data.notifications || []);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [search, typeFilter, statusFilter]);

  // Open Create / Edit Modal
  const openCreateModal = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      description: '',
      type: 'ANNOUNCEMENT',
      category: 'GENERAL',
      organization: '',
      postName: '',
      vacancies: '',
      qualification: '',
      ageLimit: '',
      applicationStartDate: '',
      applicationEndDate: '',
      applyOnlineUrl: '',
      officialNotificationPdfUrl: '',
      targetAudience: 'ALL',
      isPublic: true,
      actionUrl: '',
      status: 'PUBLISHED',
      isPinned: false,
      publishedAt: new Date().toISOString().split('T')[0],
      expiresAt: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (notif) => {
    setEditingNotification(notif);
    setFormData({
      title: notif.title || '',
      message: notif.message || '',
      description: notif.description || '',
      type: notif.type || 'ANNOUNCEMENT',
      category: notif.category || 'GENERAL',
      organization: notif.organization || '',
      postName: notif.postName || '',
      vacancies: notif.vacancies || '',
      qualification: notif.qualification || '',
      ageLimit: notif.ageLimit || '',
      applicationStartDate: notif.applicationStartDate ? new Date(notif.applicationStartDate).toISOString().split('T')[0] : '',
      applicationEndDate: notif.applicationEndDate ? new Date(notif.applicationEndDate).toISOString().split('T')[0] : '',
      applyOnlineUrl: notif.applyOnlineUrl || '',
      officialNotificationPdfUrl: notif.officialNotificationPdfUrl || '',
      targetAudience: notif.targetAudience || 'ALL',
      isPublic: notif.isPublic !== undefined ? notif.isPublic : true,
      actionUrl: notif.actionUrl || notif.link || '',
      status: notif.status || 'PUBLISHED',
      isPinned: Boolean(notif.isPinned),
      publishedAt: notif.publishedAt ? new Date(notif.publishedAt).toISOString().split('T')[0] : '',
      expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }
    if (!formData.message.trim()) {
      formData.message = formData.title;
    }

    try {
      setSaving(true);
      if (editingNotification) {
        const res = await publicNotificationService.updateAdminNotification(editingNotification._id, formData);
        if (res?.success) success('Notification updated successfully');
      } else {
        const res = await publicNotificationService.createAdminNotification(formData);
        if (res?.success) success('Notification created and announced');
      }
      setModalOpen(false);
      fetchNotifications();
    } catch (err) {
      toastError(err.message || 'Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Pinned
  const handleTogglePinned = async (id) => {
    try {
      const res = await publicNotificationService.toggleNotificationPinned(id);
      if (res?.success) {
        success(`Pinned status updated`);
        fetchNotifications();
      }
    } catch (err) {
      toastError(err.message || 'Failed to toggle pinned status');
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const res = await publicNotificationService.toggleNotificationStatus(id);
      if (res?.success) {
        success(`Status updated to ${res.data?.status}`);
        fetchNotifications();
      }
    } catch (err) {
      toastError(err.message || 'Failed to toggle status');
    }
  };

  // Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete announcement "${title}"?`)) return;
    try {
      const res = await publicNotificationService.deleteAdminNotification(id);
      if (res?.success) {
        success('Notification deleted successfully');
        fetchNotifications();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete notification');
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Institutional Announcements & Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish examination alerts, batch circulars, admission deadlines, and public notices.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'JOB_ALERT', 'EXAM_ALERT', 'ANNOUNCEMENT', 'ADMISSION', 'RESULT', 'GENERAL'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No announcements found</h3>
          <p className="text-xs text-slate-400 mt-1">Create an announcement to broadcast it across student and public portals.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Announcement</th>
                  <th className="p-3.5">Type & Audience</th>
                  <th className="p-3.5">Published Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <tr key={notif._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {notif.isPinned && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {notif.title}
                          </span>
                        </div>
                        {notif.type === 'JOB_ALERT' && (notif.organization || notif.postName) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                            {notif.organization && (
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                🏢 {notif.organization}
                              </span>
                            )}
                            {notif.postName && (
                              <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                📌 {notif.postName}
                              </span>
                            )}
                            {Number(notif.vacancies) > 0 && (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                👥 {notif.vacancies} Posts
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-slate-500 text-[11px] line-clamp-1 max-w-md">
                          {notif.description || notif.message}
                        </p>
                        {notif.actionUrl && (
                          <span className="text-[10.5px] text-[#1769D2] truncate block max-w-xs">
                            🔗 {notif.actionUrl}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          notif.type === 'JOB_ALERT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-[#1769D2]'
                        }`}>
                          {notif.type.replace('_', ' ')}
                        </span>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          {notif.category ? notif.category.replace('_', ' ') : `Audience: ${notif.targetAudience}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div>
                          {notif.publishedAt
                            ? new Date(notif.publishedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </div>
                        {notif.expiresAt && (
                          <div className={`text-[10px] font-bold ${
                            new Date(notif.expiresAt) < new Date() ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {new Date(notif.expiresAt) < new Date() ? 'Expired / Closed' : `Ends: ${new Date(notif.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(notif._id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          notif.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {notif.status || 'PUBLISHED'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePinned(notif._id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            notif.isPinned
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Toggle pin to top"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(notif)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(notif._id, notif.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">
                {editingNotification ? 'Edit Announcement' : 'New Institutional Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IBPS PO Prelims 2026 Admit Cards Released"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="JOB_ALERT">Govt / Banking Job Alert</option>
                    <option value="EXAM_ALERT">Exam Alert</option>
                    <option value="ADMISSION">Admission Notice</option>
                    <option value="RESULT">Result / Cutoff</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="ALL">Everyone (Public & Students)</option>
                    <option value="STUDENTS">Enrolled Students Only</option>
                    <option value="BANKING">Banking Aspirants</option>
                    <option value="ENTRANCE">Entrance Candidates</option>
                  </select>
                </div>
              </div>

              {formData.type === 'JOB_ALERT' && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                  <p className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                    Government / Banking Job Alert Specific Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Recruiting Sector</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      >
                        <option value="BANKING">Banking (IBPS, SBI, RBI)</option>
                        <option value="CENTRAL_GOVT">Central Govt (SSC, UPSC)</option>
                        <option value="STATE_GOVT">State Govt (APPSC, TSPSC)</option>
                        <option value="INSURANCE">Insurance (LIC, NIACL)</option>
                        <option value="RAILWAYS">Railways (RRB)</option>
                        <option value="DEFENSE">Defence & Police</option>
                        <option value="TEACHING">Teaching Exams</option>
                        <option value="GENERAL">Other Govt Jobs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Organization / Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India (SBI)"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Post / Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Probationary Officer (PO)"
                        value={formData.postName}
                        onChange={(e) => setFormData({ ...formData, postName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total Vacancies</label>
                      <input
                        type="number"
                        placeholder="e.g. 2000"
                        value={formData.vacancies}
                        onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Qualification Required</label>
                      <input
                        type="text"
                        placeholder="e.g. Any Degree / Graduate"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Age Limit</label>
                      <input
                        type="text"
                        placeholder="e.g. 21 - 30 Years"
                        value={formData.ageLimit}
                        onChange={(e) => setFormData({ ...formData, ageLimit: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">App. Start Date</label>
                      <input
                        type="date"
                        value={formData.applicationStartDate}
                        onChange={(e) => setFormData({ ...formData, applicationStartDate: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">App. End Date (Deadline)</label>
                      <input
                        type="date"
                        value={formData.applicationEndDate}
                        onChange={(e) => setFormData({ ...formData, applicationEndDate: e.target.value, expiresAt: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Official Apply Online URL</label>
                      <input
                        type="url"
                        placeholder="https://ibpsonline.ibps.in/..."
                        value={formData.applyOnlineUrl}
                        onChange={(e) => setFormData({ ...formData, applyOnlineUrl: e.target.value, actionUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Official Notification PDF URL</label>
                      <input
                        type="url"
                        placeholder="https://.../notification.pdf"
                        value={formData.officialNotificationPdfUrl}
                        onChange={(e) => setFormData({ ...formData, officialNotificationPdfUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Detailed Body</label>
                <textarea
                  rows={3}
                  placeholder="Official notification text, instructions, or exam dates..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action URL / Attachment Link</label>
                  <input
                    type="text"
                    placeholder="https://... or /tuition-programs/..."
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded text-[#0B2545] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700">Pin Announcement</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'PUBLISHED'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? 'PUBLISHED' : 'DRAFT',
                      })
                    }
                    className="rounded text-[#0B2545] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700">Publish Immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#0B2545] text-white font-bold hover:bg-[#1E293B] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingNotification ? 'Update Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
