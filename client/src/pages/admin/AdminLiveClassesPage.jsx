import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { liveClassService, courseService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useRealtimeEvent } from '../../context/SocketContext';
import { ZoomJoinButton } from '../../components/live/ZoomJoinButton';
import { Video, Plus, Calendar, Clock, User, Ban, CheckCircle2, AlertCircle, Edit, Trash2, Search, X, Filter, RotateCcw } from 'lucide-react';

export const AdminLiveClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const { success, error: toastError } = useToast();

  const [classForm, setClassForm] = useState({
    title: '',
    courseId: '',
    subject: 'General Banking',
    batchName: 'Evening Regular',
    facultyName: 'Prof. Rajesh Sharma (Ex-AGM SBI)',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '19:30',
    durationMinutes: 75,
    zoomMeetingUrl: '',
    zoomMeetingId: '',
    zoomPasscode: '',
    instructions: 'Please join 10 minutes prior with Zoom desktop application or mobile app.',
  });

  const fetchLiveClasses = async () => {
    try {
      const [classRes, courseRes] = await Promise.all([
        liveClassService.getAllLiveClasses({ limit: 50 }),
        courseService.getCourses({ limit: 50 }),
      ]);
      if (classRes.success && classRes.data) {
        setClasses(classRes.data.classes || []);
      }
      if (courseRes.success && courseRes.data) {
        setCourses(courseRes.data.courses || []);
        if (courseRes.data.courses?.length > 0 && !classForm.courseId) {
          setClassForm(prev => ({ ...prev, courseId: courseRes.data.courses[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  useRealtimeEvent('live_classes:updated', useCallback(() => {
    fetchLiveClasses();
  }, []));

  const handleOpenAdd = () => {
    setEditingClassId(null);
    setClassForm({
      title: '',
      courseId: courses[0]?._id || '',
      subject: 'General Banking',
      batchName: 'Evening Regular',
      facultyName: 'Prof. Rajesh Sharma (Ex-AGM SBI)',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '19:30',
      durationMinutes: 75,
      zoomMeetingUrl: '',
      zoomMeetingId: '',
      zoomPasscode: '',
      instructions: 'Please join 10 minutes prior with Zoom desktop application or mobile app.',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClassId(cls._id);
    setClassForm({
      title: cls.title || '',
      courseId: cls.courseId?._id || cls.courseId || '',
      subject: cls.subject || '',
      batchName: cls.batchName || '',
      facultyName: cls.facultyName || '',
      scheduledDate: cls.scheduledDate ? new Date(cls.scheduledDate).toISOString().split('T')[0] : '',
      startTime: cls.startTime || '19:30',
      durationMinutes: cls.durationMinutes || 60,
      zoomMeetingUrl: cls.zoomMeetingUrl || '',
      zoomMeetingId: cls.zoomMeetingId || '',
      zoomPasscode: cls.zoomPasscode || '',
      instructions: cls.instructions || '',
    });
    setShowAddModal(true);
  };

  const handleSubmitClass = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingClassId) {
        res = await liveClassService.updateLiveClass(editingClassId, classForm);
      } else {
        res = await liveClassService.createLiveClass(classForm);
      }
      if (res.success) {
        success(editingClassId ? 'Live class updated successfully!' : 'Live Zoom class scheduled! Enrolled students have been notified.');
        setShowAddModal(false);
        fetchLiveClasses();
      }
    } catch (err) {
      toastError(err.message || 'Failed to save class');
    }
  };

  const handleCancelClass = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel the live class "${title}"? Enrolled students will receive a cancellation notice.`)) return;
    try {
      const res = await liveClassService.cancelLiveClass(id);
      if (res.success) {
        success('Live class cancelled and students notified');
        fetchLiveClasses();
      }
    } catch (err) {
      toastError(err.message || 'Failed to cancel class');
    }
  };

  const handleDeleteClass = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete the live class "${title}"?`)) return;
    try {
      const res = await liveClassService.deleteLiveClass(id);
      if (res.success) {
        success('Live class deleted successfully');
        fetchLiveClasses();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete live class');
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const title = (cls.title || '').toLowerCase();
        const faculty = (cls.facultyName || '').toLowerCase();
        const course = (cls.courseId?.title || '').toLowerCase();
        const meetingId = (cls.zoomMeetingId || '').toLowerCase();

        const matches =
          title.includes(q) ||
          faculty.includes(q) ||
          course.includes(q) ||
          meetingId.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }, [classes, statusFilter, searchQuery]);

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Live Zoom Class Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule Zoom batches, validate meeting links, monitor statuses, and broadcast notifications.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Schedule New Class
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
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live Now</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search class, faculty, course..."
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
          Showing <span className="text-[#12356B]">{filteredClasses.length}</span> of {classes.length} Classes
        </div>
      </div>

      {/* Classes Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Class Title</th>
                <th className="p-4 font-bold">Course</th>
                <th className="p-4 font-bold">Faculty</th>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClasses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No live classes found matching your search and filter criteria.
                  </td>
                </tr>
              )}
              {filteredClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-[#12356B]">
                    <div>{cls.title}</div>
                    <span className="text-[10px] text-slate-400 font-normal">ID: {cls.zoomMeetingId || 'Direct Link'}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-600">{cls.courseId?.title}</td>
                  <td className="p-4">{cls.facultyName}</td>
                  <td className="p-4">
                    <span className="font-bold">{new Date(cls.scheduledDate).toLocaleDateString()}</span> at {cls.startTime}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      cls.status === 'SCHEDULED'
                        ? 'bg-blue-100 text-[#1769D2]'
                        : cls.status === 'LIVE'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : cls.status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {cls.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-[#1769D2] hover:text-[#0B1E3D] hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      title="Edit Live Class"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {cls.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleCancelClass(cls._id, cls.title)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                        title="Cancel Live Class"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClass(cls._id, cls.title)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                      title="Delete Live Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Schedule Live Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-[#12356B] font-heading">
              {editingClassId ? 'Edit Live Zoom Class' : 'Schedule Live Zoom Class'}
            </h3>

            <form onSubmit={handleSubmitClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  placeholder="e.g. JAIIB IE&IFS Doubt Resolution Session"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course *</label>
                  <select
                    value={classForm.courseId}
                    onChange={(e) => setClassForm({ ...classForm, courseId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Module</label>
                  <input
                    type="text"
                    value={classForm.subject}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    value={classForm.facultyName}
                    onChange={(e) => setClassForm({ ...classForm, facultyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Name</label>
                  <input
                    type="text"
                    value={classForm.batchName}
                    onChange={(e) => setClassForm({ ...classForm, batchName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={classForm.scheduledDate}
                    onChange={(e) => setClassForm({ ...classForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time (24h) *</label>
                  <input
                    type="text"
                    required
                    value={classForm.startTime}
                    onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                    placeholder="19:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={classForm.durationMinutes}
                    onChange={(e) => setClassForm({ ...classForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zoom Meeting URL * (Must be zoom.us domain)</label>
                <input
                  type="url"
                  required
                  value={classForm.zoomMeetingUrl}
                  onChange={(e) => setClassForm({ ...classForm, zoomMeetingUrl: e.target.value })}
                  placeholder="https://us04web.zoom.us/j/84291823910?pwd=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zoom Meeting ID (Optional)</label>
                  <input
                    type="text"
                    value={classForm.zoomMeetingId}
                    onChange={(e) => setClassForm({ ...classForm, zoomMeetingId: e.target.value })}
                    placeholder="842 9182 3910"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Passcode (Optional)</label>
                  <input
                    type="text"
                    value={classForm.zoomPasscode}
                    onChange={(e) => setClassForm({ ...classForm, zoomPasscode: e.target.value })}
                    placeholder="RANVI26"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-bold shadow-md hover:bg-[#0e2a56] transition-colors"
                >
                  {editingClassId ? 'Update Class' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
