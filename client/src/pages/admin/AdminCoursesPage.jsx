import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { courseService, adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useRealtimeEvent } from '../../context/SocketContext';
import { BookOpen, Plus, Edit, Trash2, Eye, CheckCircle2, XCircle, Filter, MapPin, Search, X, RotateCcw, Tags, FolderTree } from 'lucide-react';

export const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  // Categories Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryDivisionFilter, setCategoryDivisionFilter] = useState('ALL');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    division: 'BANKERS_PATH',
    description: '',
    color: '#1769D2',
    sortOrder: 0,
    isActive: true,
  });

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

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await courseService.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleOpenCategoryModal = () => {
    fetchCategories();
    setEditingCategoryId(null);
    setCategoryForm({
      name: '',
      slug: '',
      division: 'BANKERS_PATH',
      description: '',
      color: '#1769D2',
      sortOrder: 0,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({
      name: cat.name || '',
      slug: cat.slug || '',
      division: cat.division || 'BANKERS_PATH',
      description: cat.description || '',
      color: cat.color || '#1769D2',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toastError('Category name is required');
      return;
    }
    try {
      if (editingCategoryId) {
        const res = await courseService.updateCategory(editingCategoryId, categoryForm);
        if (res.success) {
          success('Category updated successfully');
          fetchCategories();
          setEditingCategoryId(null);
          setCategoryForm({
            name: '',
            slug: '',
            division: 'BANKERS_PATH',
            description: '',
            color: '#1769D2',
            sortOrder: 0,
            isActive: true,
          });
        }
      } else {
        const res = await courseService.createCategory(categoryForm);
        if (res.success) {
          success('Category created successfully');
          fetchCategories();
          setCategoryForm({
            name: '',
            slug: '',
            division: 'BANKERS_PATH',
            description: '',
            color: '#1769D2',
            sortOrder: 0,
            isActive: true,
          });
        }
      }
    } catch (err) {
      toastError(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await courseService.deleteCategory(catId);
      if (res.success) {
        success('Category deleted successfully');
        fetchCategories();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete category');
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
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Course Catalogue Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, publish, configure pricing, homepage tiles, state associations, and syllabus modules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCategoryModal}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#12356B] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <Tags className="w-4 h-4 text-[#1769D2]" />
            <span>Manage Categories</span>
          </button>
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add New Course
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
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
            <option value="TUITIONS">Tuitions & Coaching</option>
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

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
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

      {/* Categories Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#12356B] font-heading">
                    Manage Course Categories
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Create, update, and reorder categories across educational divisions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-4 space-y-6 pr-1">
              {/* Category Create / Edit Form */}
              <form onSubmit={handleSaveCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-extrabold text-[#12356B] text-xs">
                  {editingCategoryId ? 'Edit Category' : 'Create New Category'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. JAIIB Exams"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Division *</label>
                    <select
                      value={categoryForm.division}
                      onChange={(e) => setCategoryForm({ ...categoryForm, division: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    >
                      <option value="BANKERS_PATH">Banker's Path</option>
                      <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
                      <option value="ENTRANCE_EXAMS">Entrance Exams</option>
                      <option value="TUITIONS">Tuitions & Coaching</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tag / Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        placeholder="#1769D2"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Short summary of exams covered"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={categoryForm.isActive}
                        onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                        className="rounded text-[#1769D2]"
                      />
                      <span>Active & Visible</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {editingCategoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setCategoryForm({
                              name: '',
                              slug: '',
                              division: 'BANKERS_PATH',
                              description: '',
                              color: '#1769D2',
                              sortOrder: 0,
                              isActive: true,
                            });
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#12356B] hover:bg-[#0e2a56] text-white font-bold shadow-xs"
                      >
                        {editingCategoryId ? 'Update Category' : 'Create Category'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Division Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
                {['ALL', 'BANKERS_PATH', 'COMPETITIVE_EXAMS', 'ENTRANCE_EXAMS', 'TUITIONS'].map((div) => (
                  <button
                    key={div}
                    type="button"
                    onClick={() => setCategoryDivisionFilter(div)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      categoryDivisionFilter === div
                        ? 'bg-[#12356B] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {div === 'ALL' ? 'All Divisions' : div.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                      <th className="p-3 font-bold">Category Name</th>
                      <th className="p-3 font-bold">Division</th>
                      <th className="p-3 font-bold">Slug</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {categories
                      .filter((c) => categoryDivisionFilter === 'ALL' || c.division === categoryDivisionFilter)
                      .map((cat) => (
                        <tr key={cat._id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-[#12356B] flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: cat.color || '#1769D2' }}
                            />
                            <span>{cat.name}</span>
                          </td>
                          <td className="p-3 font-semibold text-slate-500">{cat.division}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">{cat.slug}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {cat.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(cat)}
                              className="p-1 text-[#1769D2] hover:bg-blue-50 rounded"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat._id, cat.name)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {categories.filter((c) => categoryDivisionFilter === 'ALL' || c.division === categoryDivisionFilter).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                          No categories found for this division.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
