import React, { useState, useEffect } from 'react';
import { entranceExamService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  School,
  Cpu,
  Stethoscope,
  Building2,
} from 'lucide-react';

export const AdminEntranceExamsPage = () => {
  const { success, error: toastError } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    shortCode: '',
    category: 'Engineering & Technology',
    badge: 'National Level',
    description: '',
    targetAdmissions: '',
    eligibility: '',
    conductingBody: '',
    examPattern: '',
    syllabusHighlights: '',
    iconName: 'GraduationCap',
    colorTheme: 'blue',
    displayOrder: 1,
    isActive: true,
    isFeatured: true,
  });

  const categories = [
    'ALL',
    'Engineering & Technology',
    'Medical & Healthcare',
    'Central Universities',
    'State Level (Andhra Pradesh)',
    'State Level (Telangana)',
    'Polytechnic Diploma',
    'Residential Colleges',
    'Residential Schools',
  ];

  const colorThemes = [
    { id: 'blue', name: 'Royal Blue', class: 'bg-blue-600' },
    { id: 'teal', name: 'Teal Green', class: 'bg-teal-600' },
    { id: 'emerald', name: 'Emerald', class: 'bg-emerald-600' },
    { id: 'indigo', name: 'Indigo Navy', class: 'bg-indigo-600' },
    { id: 'purple', name: 'Royal Purple', class: 'bg-purple-600' },
    { id: 'amber', name: 'Warm Amber', class: 'bg-amber-500' },
    { id: 'rose', name: 'Rose Red', class: 'bg-rose-600' },
    { id: 'cyan', name: 'Cyan Sky', class: 'bg-cyan-600' },
  ];

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await entranceExamService.getEntranceExams({ includeInactive: 'true' });
      if (res.success && res.data) {
        setExams(res.data);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load entrance exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      shortCode: '',
      category: 'Engineering & Technology',
      badge: 'National Level',
      description: '',
      targetAdmissions: '',
      eligibility: '',
      conductingBody: '',
      examPattern: '',
      syllabusHighlights: '',
      iconName: 'GraduationCap',
      colorTheme: 'blue',
      displayOrder: exams.length + 1,
      isActive: true,
      isFeatured: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingId(exam._id);
    setFormData({
      title: exam.title || '',
      shortCode: exam.shortCode || '',
      category: exam.category || 'Engineering & Technology',
      badge: exam.badge || 'National Level',
      description: exam.description || '',
      targetAdmissions: exam.targetAdmissions || '',
      eligibility: exam.eligibility || '',
      conductingBody: exam.conductingBody || '',
      examPattern: exam.examPattern || '',
      syllabusHighlights: Array.isArray(exam.syllabusHighlights)
        ? exam.syllabusHighlights.join(', ')
        : exam.syllabusHighlights || '',
      iconName: exam.iconName || 'GraduationCap',
      colorTheme: exam.colorTheme || 'blue',
      displayOrder: exam.displayOrder !== undefined ? exam.displayOrder : 1,
      isActive: exam.isActive !== undefined ? exam.isActive : true,
      isFeatured: exam.isFeatured !== undefined ? exam.isFeatured : true,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Exam title is required');
      return;
    }
    if (!formData.description.trim()) {
      toastError('Exam description is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        displayOrder: Number(formData.displayOrder) || 0,
        syllabusHighlights: formData.syllabusHighlights
          ? formData.syllabusHighlights.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingId) {
        const res = await entranceExamService.updateEntranceExam(editingId, payload);
        if (res.success) {
          success('Entrance exam updated successfully!');
          setShowModal(false);
          fetchExams();
        }
      } else {
        const res = await entranceExamService.createEntranceExam(payload);
        if (res.success) {
          success('New entrance exam created successfully!');
          setShowModal(false);
          fetchExams();
        }
      }
    } catch (err) {
      toastError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await entranceExamService.deleteEntranceExam(id);
      if (res.success) {
        success('Entrance exam program deleted successfully');
        setDeleteConfirmId(null);
        fetchExams();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete entrance exam');
    }
  };

  const handleToggleStatus = async (exam) => {
    try {
      const res = await entranceExamService.updateEntranceExam(exam._id, {
        isActive: !exam.isActive,
      });
      if (res.success) {
        success(`Program marked as ${!exam.isActive ? 'Active' : 'Inactive'}`);
        fetchExams();
      }
    } catch (err) {
      toastError(err.message || 'Status update failed');
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        'This will restore / reset the 9 standard default Entrance Exam programs (JEE Main, NEET-UG, CUET-UG, AP/TG EAPCET, POLYCET, APRJC CET, TGCET). Proceed?'
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const res = await entranceExamService.seedDefaultEntranceExams();
      if (res.success) {
        success('Standard Entrance Exam programs restored successfully!');
        fetchExams();
      }
    } catch (err) {
      toastError(err.message || 'Failed to seed defaults');
    } finally {
      setLoading(false);
    }
  };

  // Filtered exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.shortCode && exam.shortCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.targetAdmissions && exam.targetAdmissions.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || exam.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-3">
      {/* Top Banner & Header */}
      <div className="shrink-0 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#1769D2] uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" /> Academic Admissions Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E3D] font-heading">
            Entrance Exam Programs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manage National and State level entrance exam coaching programs. All modifications made here are updated dynamically across the website and homepage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
            title="Restore default 9 entrance exam programs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset 9 Defaults</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs sm:text-sm font-black shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#F4B942]" />
            <span>Add New Program</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="shrink-0 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by exam name, admissions target, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0B1E3D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Programs List Table / Cards */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading entrance exam programs...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1E3D]">No Entrance Exam Programs Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No programs matched your filters. You can add a new one or click below to restore the 9 standard defaults.
              </p>
            </div>
            <button
              onClick={handleSeedDefaults}
              className="bg-[#0B1E3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#12356B]"
            >
              Restore 9 Standard Defaults
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-[#0B1E3D] border-b border-slate-200">
                  <th className="py-3.5 px-4 font-black w-14 text-center">Order</th>
                  <th className="py-3.5 px-4 font-black">Exam Program</th>
                  <th className="py-3.5 px-4 font-black">Level / Badge</th>
                  <th className="py-3.5 px-4 font-black">Category</th>
                  <th className="py-3.5 px-4 font-black">Official Description</th>
                  <th className="py-3.5 px-4 font-black">Target Admissions</th>
                  <th className="py-3.5 px-4 font-black text-center">Status</th>
                  <th className="py-3.5 px-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-black text-slate-400">
                      #{exam.displayOrder}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] text-[#1769D2] flex items-center justify-center font-black text-xs shrink-0 border border-blue-200">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-[#0B1E3D] text-sm leading-tight">
                            {exam.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            slug: {exam.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          exam.badge?.includes('National')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : exam.badge?.includes('Andhra')
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : exam.badge?.includes('Telangana')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {exam.badge || 'National Level'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                      {exam.category}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                      {exam.description}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
                      {exam.targetAdmissions || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(exam)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full transition-colors ${
                          exam.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          title="Edit Program"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exam._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#0B1E3D]">Confirm Program Deletion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete this entrance exam program? This action will remove it from the homepage and public catalogue.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-[#1769D2] uppercase tracking-wider">
                  {editingId ? 'Edit Program' : 'New Program Entry'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0B1E3D] font-heading mt-0.5">
                  {editingId ? `Update ${formData.title}` : 'Add Entrance Exam Program'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Exam Title * (e.g. JEE Main, NEET-UG)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. JEE Main"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Short Code / Acronym
                  </label>
                  <input
                    type="text"
                    value={formData.shortCode}
                    onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                    placeholder="e.g. JEE-MAIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  >
                    <option value="Engineering & Technology">Engineering & Technology</option>
                    <option value="Medical & Healthcare">Medical & Healthcare</option>
                    <option value="Central Universities">Central Universities</option>
                    <option value="State Level (Andhra Pradesh)">State Level (Andhra Pradesh)</option>
                    <option value="State Level (Telangana)">State Level (Telangana)</option>
                    <option value="Polytechnic Diploma">Polytechnic Diploma</option>
                    <option value="Residential Colleges">Residential Colleges</option>
                    <option value="Residential Schools">Residential Schools</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Level / Badge
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  >
                    <option value="National Level">National Level</option>
                    <option value="State Level - Andhra Pradesh">State Level - Andhra Pradesh</option>
                    <option value="State Level - Telangana">State Level - Telangana</option>
                    <option value="Polytechnic Entrance">Polytechnic Entrance</option>
                    <option value="Residential Gurukul">Residential Gurukul</option>
                  </select>
                </div>
              </div>

              {/* Exact Description (Required) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Official Program Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Admission to B.Tech programs at NITs, IIITs, and other engineering institutions."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This description is displayed prominently on the homepage and program cards.
                </p>
              </div>

              {/* Target Admissions & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Target Admissions / Courses
                  </label>
                  <input
                    type="text"
                    value={formData.targetAdmissions}
                    onChange={(e) => setFormData({ ...formData, targetAdmissions: e.target.value })}
                    placeholder="e.g. B.Tech / B.E. at NITs, IIITs, CFTIs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Eligibility Criteria
                  </label>
                  <input
                    type="text"
                    value={formData.eligibility}
                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                    placeholder="e.g. 12th Standard / Inter with PCM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Conducting Body & Exam Pattern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Conducting Authority
                  </label>
                  <input
                    type="text"
                    value={formData.conductingBody}
                    onChange={(e) => setFormData({ ...formData, conductingBody: e.target.value })}
                    placeholder="e.g. National Testing Agency (NTA)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Exam Pattern / Duration
                  </label>
                  <input
                    type="text"
                    value={formData.examPattern}
                    onChange={(e) => setFormData({ ...formData, examPattern: e.target.value })}
                    placeholder="e.g. Computer-Based Test (CBT) • 3 Hours"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Syllabus Highlights */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Key Subjects / Syllabus Highlights (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.syllabusHighlights}
                  onChange={(e) => setFormData({ ...formData, syllabusHighlights: e.target.value })}
                  placeholder="e.g. Physics, Chemistry, Mathematics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                />
              </div>

              {/* Theme & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Color Accent Theme
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {colorThemes.map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, colorTheme: ct.id })}
                        className={`w-7 h-7 rounded-full ${ct.class} flex items-center justify-center transition-all ${
                          formData.colorTheme === ct.id
                            ? 'ring-4 ring-slate-300 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={ct.name}
                      >
                        {formData.colorTheme === ct.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Active & Featured Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1769D2] focus:ring-[#1769D2]"
                  />
                  <span>Active (Visible on Website)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1769D2] focus:ring-[#1769D2]"
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntranceExamsPage;
