import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { courseService, adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useRealtimeEvent } from '../../context/SocketContext';
import { BookOpen, Plus, Edit, Trash2, Eye, CheckCircle2, XCircle, Filter, MapPin, Search, X, RotateCcw } from 'lucide-react';

export const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, includeUnpublished: 'true' };
      if (selectedDivision !== 'ALL') {
        params.division = selectedDivision;
      }
      if (selectedState !== 'ALL') {
        params.state = selectedState;
      }
      const res = await courseService.getCourses(params);
      if (res.success && res.data) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await courseService.getAvailableStates();
        if (res.success && Array.isArray(res.data)) {
          setAvailableStates(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedDivision, selectedState]);

  // Real-time updates for courses catalog
  useRealtimeEvent('courses:updated', useCallback(() => {
    fetchCourses();
  }, [selectedDivision, selectedState]));

  const handleTogglePublish = async (course) => {
    try {
      const updatedStatus = !course.isPublished;
      const res = await adminService.updateCourse(course._id, { isPublished: updatedStatus });
      if (res.success) {
        success(`"${course.title}" is now ${updatedStatus ? 'Published live' : 'saved as Draft'}`);
        fetchCourses();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update course status');
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"?\n\nClick OK to confirm permanent deletion.`)) return;
    try {
      const res = await adminService.deleteCourse(`${id}?permanent=true`);
      if (res.success) {
        success('Course permanently deleted');
        fetchCourses();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete course');
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const title = (c.title || '').toLowerCase();
    const shortName = (c.tileShortName || '').toLowerCase();
    const slug = (c.slug || '').toLowerCase();
    const desc = (c.shortDescription || '').toLowerCase();
    return title.includes(q) || shortName.includes(q) || slug.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Course Catalogue Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, publish, configure pricing, homepage tiles, state associations, and syllabus modules.
          </p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-[#1769D2]" /> Filter by:
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title..."
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

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700"
          >
            <option value="ALL">All Divisions</option>
            <option value="BANKERS_PATH">Banker's Path</option>
            <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
            <option value="ENTRANCE_EXAMS">Entrance Exams</option>
          </select>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700"
          >
            <option value="ALL">All States (India)</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {(selectedDivision !== 'ALL' || selectedState !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDivision('ALL');
                setSelectedState('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-[#12356B]">{filteredCourses.length}</span> of {courses.length} Courses
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading courses...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                  <th className="p-4 font-bold">Course Title & Tile</th>
                  <th className="p-4 font-bold">Division</th>
                  <th className="p-4 font-bold">Target States</th>
                  <th className="p-4 font-bold">Mode</th>
                  <th className="p-4 font-bold">Duration</th>
                  <th className="p-4 font-bold">Fee (INR)</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No courses match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course._id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          {course.tileColor && (
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white"
                              style={{ backgroundColor: course.tileColor }}
                              title={`Tile Color: ${course.tileColor}`}
                            />
                          )}
                          <div>
                            <div className="font-bold text-[#12356B]">
                              {course.title}
                            </div>
                            {course.tileSubtitle && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                Subtitle: {course.tileSubtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {course.division === 'BANKERS_PATH' && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2] uppercase">
                            Banker's Path
                          </span>
                        )}
                        {course.division === 'COMPETITIVE_EXAMS' && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                            Competitive Exam
                          </span>
                        )}
                        {course.division === 'ENTRANCE_EXAMS' && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                            Entrance Exam
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {course.states && course.states.length > 0 ? (
                            course.states.map((st) => (
                              <span
                                key={st}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {st}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              All India
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{course.mode}</td>
                      <td className="p-4">{course.duration}</td>
                      <td className="p-4 font-black text-[#12356B]">₹{course.fee}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(course)}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                            course.isPublished
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                          }`}
                          title="Click to toggle publish / draft status"
                        >
                          {course.isPublished ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-600" /> Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <Link
                          to={`/courses/${course.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-[#1769D2] hover:bg-slate-100 rounded-lg inline-block transition-colors"
                          title="View Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/courses/${course.slug}/edit`}
                          className="p-1.5 text-[#1769D2] hover:text-[#0B1E3D] hover:bg-blue-50 rounded-lg inline-block transition-colors"
                          title="Edit Course Program"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course._id, course.title)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg inline-block transition-colors"
                          title="Delete Course Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
