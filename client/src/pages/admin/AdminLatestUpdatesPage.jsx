import React, { useState, useEffect } from 'react';
import { latestUpdateService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Pin,
  ExternalLink,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminLatestUpdatesPage = () => {
  const { success, error: toastError } = useToast();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    badgeText: 'NEW',
    link: '',
    status: 'PUBLISHED',
    displayOrder: 0,
    isPinned: false,
    publishedAt: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  // Fetch Updates
  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await latestUpdateService.getAdminUpdates({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res?.success && res.data) {
        setUpdates(Array.isArray(res.data) ? res.data : res.data.updates || []);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load latest updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [search, statusFilter]);

  // Open Create / Edit
  const openCreateModal = () => {
    setEditingUpdate(null);
    setFormData({
      title: '',
      description: '',
      badgeText: 'NEW',
      link: '',
      status: 'PUBLISHED',
      displayOrder: 0,
      isPinned: false,
      publishedAt: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUpdate(u);
    setFormData({
      title: u.title || '',
      description: u.description || '',
      badgeText: u.badgeText || 'NEW',
      link: u.link || '',
      status: u.status || 'PUBLISHED',
      displayOrder: u.displayOrder || 0,
      isPinned: Boolean(u.isPinned),
      publishedAt: u.publishedAt ? new Date(u.publishedAt).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Update title is required');
      return;
    }

    try {
      setSaving(true);
      if (editingUpdate) {
        const res = await latestUpdateService.updateUpdate(editingUpdate._id, formData);
        if (res?.success) {
          success('Latest update modified successfully');
        }
      } else {
        const res = await latestUpdateService.createUpdate(formData);
        if (res?.success) {
          success('Latest update created and published');
        }
      }
      setModalOpen(false);
      fetchUpdates();
    } catch (err) {
      toastError(err.message || 'Failed to save update');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const res = await latestUpdateService.toggleUpdateStatus(id);
      if (res?.success) {
        success(`Update status changed to ${res.data?.status}`);
        fetchUpdates();
      }
    } catch (err) {
      toastError(err.message || 'Failed to toggle status');
    }
  };

  // Delete Update
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete update: "${title}"?`)) return;
    try {
      const res = await latestUpdateService.deleteUpdate(id);
      if (res?.success) {
        success('Update deleted successfully');
        fetchUpdates();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete update');
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Page Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Home Page Latest Updates Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage dynamic ticker updates, announcements, and banners displayed across the public portal.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Update
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search updates by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {/* Updates Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading updates...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No updates found</h3>
          <p className="text-xs text-slate-400 mt-1">Create your first update to feature it on the home page ticker.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Badge & Title</th>
                  <th className="p-3.5">Publication Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {updates.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.badgeText || 'UPDATE'}
                          </span>
                          {u.isPinned && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {u.title}
                          </span>
                        </div>
                        {u.description && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 max-w-md">
                            {u.description}
                          </p>
                        )}
                        {u.link && (
                          <a
                            href={u.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#1769D2] hover:underline"
                          >
                            <span>{u.link}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {u.publishedAt
                        ? new Date(u.publishedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u._id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          u.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {u.displayOrder ?? 0}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit update"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u._id, u.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete update"
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

      {/* Modal for Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">
                {editingUpdate ? 'Edit Latest Update' : 'Create New Latest Update'}
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
                  Update Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Batches for JAIIB & CAIIB Starting This Week!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="NEW, ADMISSION, URGENT"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Content</label>
                <textarea
                  rows={3}
                  placeholder="Additional details regarding the announcement or schedule..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination URL / Link</label>
                  <input
                    type="text"
                    placeholder="/courses/... or https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded text-[#0B2545] focus:ring-0"
                    />
                    <span className="font-semibold text-slate-700">Pin to Top</span>
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
                  {saving ? 'Saving...' : editingUpdate ? 'Update Changes' : 'Create Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLatestUpdatesPage;
