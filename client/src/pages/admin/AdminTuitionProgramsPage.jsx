import React, { useState, useEffect } from 'react';
import { courseService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  X,
  Calendar,
} from 'lucide-react';

export const AdminTuitionProgramsPage = () => {
  const { success, error: toastError } = useToast();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    shortDescription: '',
    description: '',
    mode: 'BOTH',
    price: 3999,
    originalPrice: 5999,
    totalSeats: 30,
    availableSeats: 30,
    isEnrollmentOpen: true,
    isPublished: true,
    batchTimings: ['Morning (06:00 AM - 08:00 AM)', 'Evening (05:30 PM - 07:30 PM)'],
    eligibilityCriteria: 'All motivated school & intermediate students',
    duration: 'Full Academic Term (10 Months)',
  });
  const [saving, setSaving] = useState(false);

  // Fetch Programs
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourses({
        division: 'TUITIONS',
        limit: 50,
      });
      if (res?.success && res.data) {
        let list = Array.isArray(res.data.courses) ? res.data.courses : res.data;
        if (search) {
          list = list.filter((p) =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.subject && p.subject.toLowerCase().includes(search.toLowerCase()))
          );
        }
        if (modeFilter !== 'ALL') {
          list = list.filter((p) => p.mode === modeFilter);
        }
        setPrograms(list);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load tuition programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [search, modeFilter]);

  // Open Create / Edit Modal
  const openCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      title: '',
      subject: '',
      shortDescription: '',
      description: '',
      mode: 'BOTH',
      price: 3999,
      originalPrice: 5999,
      totalSeats: 30,
      availableSeats: 30,
      isEnrollmentOpen: true,
      isPublished: true,
      batchTimings: ['Morning (06:00 AM - 08:00 AM)', 'Evening (05:30 PM - 07:30 PM)'],
      eligibilityCriteria: 'All motivated students',
      duration: 'Full Academic Term (10 Months)',
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProgram(p);
    setFormData({
      title: p.title || '',
      subject: p.subject || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      mode: p.mode || 'BOTH',
      price: p.price ?? 0,
      originalPrice: p.originalPrice ?? p.price ?? 0,
      totalSeats: p.totalSeats ?? 30,
      availableSeats: p.availableSeats ?? p.totalSeats ?? 30,
      isEnrollmentOpen: p.isEnrollmentOpen !== false,
      isPublished: p.isPublished !== false,
      batchTimings: Array.isArray(p.batchTimings) && p.batchTimings.length > 0
        ? p.batchTimings
        : ['Morning (06:00 AM - 08:00 AM)', 'Evening (05:30 PM - 07:30 PM)'],
      eligibilityCriteria: p.eligibilityCriteria || '',
      duration: p.duration || 'Full Academic Term',
    });
    setModalOpen(true);
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Program title is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        division: 'TUITIONS',
        category: 'TUITIONS',
      };

      if (editingProgram) {
        const res = await courseService.updateCourse(editingProgram._id, payload);
        if (res?.success) success('Tuition program updated successfully');
      } else {
        const res = await courseService.createCourse(payload);
        if (res?.success) success('New tuition program created successfully');
      }
      setModalOpen(false);
      fetchPrograms();
    } catch (err) {
      toastError(err.message || 'Failed to save tuition program');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Enrollment Status
  const handleToggleEnrollment = async (p) => {
    try {
      const updatedStatus = !p.isEnrollmentOpen;
      const res = await courseService.updateCourse(p._id, { isEnrollmentOpen: updatedStatus });
      if (res?.success) {
        success(`Enrollment ${updatedStatus ? 'Opened' : 'Closed'} for ${p.title}`);
        fetchPrograms();
      }
    } catch (err) {
      toastError(err.message || 'Failed to toggle enrollment status');
    }
  };

  // Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete tuition program: "${title}"?`)) return;
    try {
      const res = await courseService.deleteCourse(id);
      if (res?.success) {
        success('Program deleted successfully');
        fetchPrograms();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete program');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Tuition & Coaching Programs Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure school tuition batches, degree coaching, seat caps, pricing, and enrollment windows.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Tuition Program
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search programs by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ONLINE', 'OFFLINE', 'BOTH', 'HYBRID'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modeFilter === m
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'ALL' ? 'All Modes' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading tuition programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No tuition programs found</h3>
          <p className="text-xs text-slate-400 mt-1">Create a tuition coaching program to accept student enrollments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Program Details</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Pricing</th>
                  <th className="p-3.5">Seats (Avail / Total)</th>
                  <th className="p-3.5">Enrollment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          {p.title}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Subject: {p.subject || 'All Core Subjects'}</span>
                          <span>•</span>
                          <span>{p.duration || 'Full Term'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1769D2]">
                        {p.mode || 'BOTH'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-black text-slate-900">
                        ₹{(p.price ?? p.fee ?? 0).toLocaleString('en-IN')}
                      </div>
                      {p.originalPrice && p.originalPrice > (p.price ?? p.fee ?? 0) && (
                        <div className="text-[10px] text-slate-400 line-through">
                          ₹{p.originalPrice?.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.availableSeats ?? p.totalSeats ?? 30} / {p.totalSeats ?? 30}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEnrollment(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.isEnrollmentOpen !== false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {p.isEnrollmentOpen !== false ? 'ENROLLMENT OPEN' : 'CLOSED'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Program"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id, p.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Program"
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

      {/* Modal for Program Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">
                {editingProgram ? 'Edit Tuition Program' : 'New Tuition & Coaching Program'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Board Exam Target Batch (CBSE / State)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Stream</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics & Science, MPC, B.Com"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teaching Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="BOTH">Online & Offline (Hybrid)</option>
                    <option value="ONLINE">Online Interactive Only</option>
                    <option value="OFFLINE">Classroom / Offline Only</option>
                    <option value="HYBRID">Hybrid Flexible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Available Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value, 10) || 30 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seats Currently Remaining</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availableSeats}
                    onChange={(e) => setFormData({ ...formData, availableSeats: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Months / Full Academic Year"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of coaching, syllabus coverage, mock tests..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value, shortDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEnrollmentOpen}
                    onChange={(e) => setFormData({ ...formData, isEnrollmentOpen: e.target.checked })}
                    className="rounded text-[#0B2545] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700">Open for Online Enrollments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-[#0B2545] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700">Publish on Public Website</span>
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
                  {saving ? 'Saving...' : editingProgram ? 'Save Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTuitionProgramsPage;
