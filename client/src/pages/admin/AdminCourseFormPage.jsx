import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminService, courseService, uploadService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  Layers,
  Check,
  ArrowRight,
} from 'lucide-react';

export const AdminCourseFormPage = () => {
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [customStateInput, setCustomStateInput] = useState('');

  const availableStatePresets = [
    'All India',
    'Andhra Pradesh',
    'Telangana',
    'Karnataka',
    'Tamil Nadu',
    'Maharashtra',
    'Delhi',
    'Uttar Pradesh',
    'Kerala',
    'Bihar',
    'West Bengal',
  ];

  const colorPresets = [
    { label: 'Teal', hex: '#007B88' },
    { label: 'Plum', hex: '#7A1D5A' },
    { label: 'Olive', hex: '#48631E' },
    { label: 'Orange', hex: '#B94715' },
    { label: 'Slate Blue', hex: '#2D5482' },
    { label: 'Brick Red', hex: '#96372B' },
    { label: 'Dark Teal', hex: '#22636B' },
    { label: 'Purple', hex: '#512D6D' },
  ];

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    division: 'BANKERS_PATH',
    categoryId: '',
    states: ['All India'],
    tileSubtitle: '',
    tileColor: '#007B88',
    displayOrder: 1,
    shortDescription: '',
    fullDescription: '',
    fee: 3999,
    originalPrice: 6999,
    duration: '3 Months',
    mode: 'BOTH',
    batchSchedule: 'Daily Live 7:30 PM - 9:00 PM',
    validityDays: 180,
    isDemoEligible: true,
    isFeatured: true,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop',
    syllabus: [
      {
        title: 'Paper 1: Core Concepts & Fundamentals',
        description: 'Comprehensive coverage of core curriculum and syllabus topics',
        topics: ['Topic 1', 'Topic 2'],
      },
    ],
    subscriptionPlans: [],
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await courseService.getCategories();
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (isEditMode) {
          const courseRes = await courseService.getCourseBySlug(courseId);
          if (courseRes.success && courseRes.data) {
            const c = courseRes.data.course || courseRes.data;
            setFormData({
              title: c.title || '',
              slug: c.slug || '',
              division: c.division || 'BANKERS_PATH',
              categoryId: c.categoryId?._id || c.categoryId || '',
              states: Array.isArray(c.states) && c.states.length > 0 ? c.states : ['All India'],
              tileSubtitle: c.tileSubtitle || '',
              tileColor: c.tileColor || '#007B88',
              displayOrder: c.displayOrder || 1,
              shortDescription: c.shortDescription || '',
              fullDescription: c.fullDescription || '',
              fee: c.fee || 0,
              originalPrice: c.originalPrice || 0,
              duration: c.duration || '',
              mode: c.mode || 'BOTH',
              batchSchedule: c.batchSchedule || '',
              validityDays: c.validityDays || 180,
              isDemoEligible: c.isDemoEligible ?? true,
              isFeatured: c.isFeatured ?? true,
              isPublished: c.isPublished ?? true,
              thumbnail: c.thumbnail || '',
              syllabus: c.syllabus?.length > 0 ? c.syllabus : [
                { title: 'Module 1: Fundamentals', description: '', topics: ['Topic 1'] }
              ],
              subscriptionPlans: Array.isArray(c.subscriptionPlans) ? c.subscriptionPlans : [],
            });
          }
        } else if (catRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: catRes.data[0]._id }));
        }
      } catch (err) {
        console.error(err);
        toastError('Failed to initialize course form data');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [courseId, isEditMode]);

  const toggleState = (st) => {
    setFormData((prev) => {
      const current = prev.states || [];
      if (current.includes(st)) {
        const next = current.filter((s) => s !== st);
        return { ...prev, states: next.length > 0 ? next : ['All India'] };
      } else {
        return { ...prev, states: [...current, st] };
      }
    });
  };

  const handleAddCustomState = () => {
    const trimmed = customStateInput.trim();
    if (trimmed && !(formData.states || []).includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        states: [...(prev.states || []), trimmed],
      }));
      setCustomStateInput('');
    }
  };

  const handleAddSubscriptionPlan = () => {
    setFormData((prev) => ({
      ...prev,
      subscriptionPlans: [
        ...(prev.subscriptionPlans || []),
        {
          durationMonths: 3,
          price: prev.fee || 3999,
          originalPrice: prev.originalPrice || 5999,
          label: '3 Months Access',
        },
      ],
    }));
  };

  const handleRemoveSubscriptionPlan = (index) => {
    setFormData((prev) => ({
      ...prev,
      subscriptionPlans: (prev.subscriptionPlans || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubscriptionPlanChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.subscriptionPlans || [])];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'durationMonths' && !updated[index].labelManual) {
        updated[index].label = `${value} Months Access`;
      }
      return { ...prev, subscriptionPlans: updated };
    });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingThumbnail(true);
      const res = await uploadService.uploadImage(file);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
        success('Course thumbnail uploaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Image upload failed');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleAddSyllabusModule = () => {
    setFormData((prev) => ({
      ...prev,
      syllabus: [
        ...prev.syllabus,
        {
          title: `Paper ${prev.syllabus.length + 1}: Subject Name`,
          description: 'Module core concepts & syllabus breakdown',
          topics: ['Topic 1', 'Topic 2'],
        },
      ],
    }));
  };

  const handleRemoveSyllabusModule = (idx) => {
    setFormData((prev) => ({
      ...prev,
      syllabus: prev.syllabus.filter((_, i) => i !== idx),
    }));
  };

  const handleAddTopic = (moduleIdx) => {
    const updated = [...formData.syllabus];
    updated[moduleIdx].topics = [...(updated[moduleIdx].topics || []), `New Topic ${updated[moduleIdx].topics.length + 1}`];
    setFormData({ ...formData, syllabus: updated });
  };

  const handleRemoveTopic = (moduleIdx, topicIdx) => {
    const updated = [...formData.syllabus];
    updated[moduleIdx].topics = updated[moduleIdx].topics.filter((_, i) => i !== topicIdx);
    setFormData({ ...formData, syllabus: updated });
  };

  const handleTopicChange = (moduleIdx, topicIdx, value) => {
    const updated = [...formData.syllabus];
    updated[moduleIdx].topics[topicIdx] = value;
    setFormData({ ...formData, syllabus: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (isEditMode) {
        res = await adminService.updateCourse(courseId, formData);
      } else {
        res = await adminService.createCourse(formData);
      }

      if (res.success) {
        success(isEditMode ? 'Course updated successfully!' : 'Course created and published live!');
        navigate('/admin/courses');
      }
    } catch (err) {
      toastError(err.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-500">Loading course details...</p>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6 max-w-4xl">
      <div className="shrink-0 flex items-center justify-between">
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#12356B]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Directory
        </Link>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-[#0B1E3D] font-heading">
            {isEditMode ? 'Edit Course Program' : 'Create & Publish New Course Program'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure course division, category, pricing, live batch schedule, syllabus modules, and cover media.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Row 1: Title & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Course Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. JAIIB Master Class 2026 (All 4 Papers)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Coaching Division *</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="BANKERS_PATH">Banker's Path</option>
                <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
                <option value="ENTRANCE_EXAMS">Entrance Exams</option>
                <option value="TUITIONS">Tuitions & Coaching</option>
              </select>
            </div>
          </div>

          {/* Homepage Card Presentation & Tile Styling */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                  Homepage Program Tile Appearance
                </h4>
                <p className="text-[11px] text-slate-500">
                  Custom subtitle, tile background color, and display ordering on the homepage cards.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1769D2]">
                Order #{formData.displayOrder}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tile Subtitle (Homepage)</label>
                <input
                  type="text"
                  value={formData.tileSubtitle}
                  onChange={(e) => setFormData({ ...formData, tileSubtitle: e.target.value })}
                  placeholder="e.g. Master Certification Batch"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order (1–8)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tile Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.tileColor || '#007B88'}
                    onChange={(e) => setFormData({ ...formData, tileColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.tileColor}
                    onChange={(e) => setFormData({ ...formData, tileColor: e.target.value })}
                    placeholder="#007B88"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick color preset chips */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 mb-1.5">Preset Reference Palette:</span>
              <div className="flex flex-wrap gap-1.5">
                {colorPresets.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, tileColor: c.hex })}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      formData.tileColor === c.hex
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }}></span>
                    {c.label} ({c.hex})
                  </button>
                ))}
              </div>
            </div>

            {/* Tile Preview */}
            <div className="pt-2 border-t border-slate-200/80">
              <span className="block text-[11px] font-bold text-slate-500 mb-1.5">Homepage Tile Preview (4-Column Style):</span>
              <div
                className="w-32 px-2 py-2.5 rounded-xl text-white shadow-md text-center flex flex-col items-center justify-center gap-1 min-h-[66px]"
                style={{ backgroundColor: formData.tileColor || '#007B88' }}
              >
                <div className="font-black text-xs uppercase tracking-tight leading-tight w-full break-words line-clamp-2">
                  {formData.title?.split(' ')[0] || 'COURSE'}
                </div>
                <div className="text-[9.5px] text-white/95 font-medium leading-[1.15] w-full break-words line-clamp-2">
                  {formData.tileSubtitle || 'Short program subtitle'}
                </div>
              </div>
            </div>
          </div>

          {/* State Association & Filtering Configuration */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-3">
            <div>
              <h4 className="text-xs font-black uppercase text-[#12356B] tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1769D2]"></span>
                Target State(s) Association
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Select one or multiple states where this course applies. Courses tagged with <b>"All India"</b> appear across all state searches.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableStatePresets.map((st) => {
                const isSelected = (formData.states || []).includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleState(st)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#12356B] text-white border-[#12356B] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom state adder */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customStateInput}
                onChange={(e) => setCustomStateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomState();
                  }
                }}
                placeholder="Type another state / UT (e.g. Rajasthan, Odisha)..."
                className="flex-1 max-w-sm px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleAddCustomState}
                className="px-3.5 py-2 rounded-xl bg-[#1769D2] hover:bg-[#1257b0] text-white text-xs font-bold transition-colors"
              >
                Add State
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Currently Associated States:{' '}
              <span className="font-bold text-[#12356B]">
                {formData.states && formData.states.length > 0
                  ? formData.states.join(', ')
                  : 'All India'}
              </span>
            </div>
          </div>

          {/* Row 2: Category & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category Classification *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.division})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Delivery Learning Mode *</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="BOTH">Online + Offline (Hybrid Classroom)</option>
                <option value="ONLINE">Online Interactive Only</option>
                <option value="OFFLINE">Offline Classroom Only</option>
              </select>
            </div>
          </div>

          {/* Row 3: Pricing & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Enrolment Fee (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Strike-through Price (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 3 Months"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Access Validity (Days)</label>
              <input
                type="number"
                min={30}
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Subscription Duration Plans */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase text-[#12356B] tracking-wider block">
                  Subscription Duration Plans (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Allow students to select duration-based subscriptions (e.g. 3 Months, 6 Months, 1 Year)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSubscriptionPlan}
                className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Duration Plan
              </button>
            </div>

            {formData.subscriptionPlans?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No duration plans configured. Course uses single flat enrolment fee.</p>
            ) : (
              <div className="space-y-2.5">
                {formData.subscriptionPlans.map((plan, planIdx) => (
                  <div key={planIdx} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Duration</label>
                      <select
                        value={plan.durationMonths}
                        onChange={(e) => handleSubscriptionPlanChange(planIdx, 'durationMonths', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-bold bg-white"
                      >
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months (1 Year)</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Plan Label</label>
                      <input
                        type="text"
                        value={plan.label}
                        onChange={(e) => {
                          handleSubscriptionPlanChange(planIdx, 'label', e.target.value);
                          handleSubscriptionPlanChange(planIdx, 'labelManual', true);
                        }}
                        placeholder="e.g. 3 Months Plan"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Price (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={plan.price}
                        onChange={(e) => handleSubscriptionPlanChange(planIdx, 'price', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-bold text-[#12356B]"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Original (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={plan.originalPrice || ''}
                        onChange={(e) => handleSubscriptionPlanChange(planIdx, 'originalPrice', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                      />
                    </div>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubscriptionPlan(planIdx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Remove Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: Batch Schedule */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Live Batch Timing & Schedule</label>
            <input
              type="text"
              value={formData.batchSchedule}
              onChange={(e) => setFormData({ ...formData, batchSchedule: e.target.value })}
              placeholder="e.g. Daily Live Zoom 7:30 PM - 9:00 PM (Mon-Sat)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold"
            />
          </div>

          {/* Row 5: Descriptions */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Short Description (for cards) *</label>
            <textarea
              rows={2}
              required
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Summary highlighting primary target exams and core benefits..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full In-Depth Description *</label>
            <textarea
              rows={4}
              required
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              placeholder="Detailed syllabus outline, eligibility, faculty background, and study plan..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>

          {/* Publishing & Visibility Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
              Publishing & Visibility Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="mt-0.5 rounded text-[#1769D2] focus:ring-[#1769D2]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Published Live</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Course is publicly visible and open for enrolment
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="mt-0.5 rounded text-[#1769D2] focus:ring-[#1769D2]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Featured Course</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Prioritize on homepage tiles and course cards
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isDemoEligible}
                  onChange={(e) => setFormData({ ...formData, isDemoEligible: e.target.checked })}
                  className="mt-0.5 rounded text-[#1769D2] focus:ring-[#1769D2]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Free Demo Trial</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Enable preview lessons and sample test for trial users
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Row 6: Course Thumbnail Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800">Course Thumbnail Image</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {formData.thumbnail && (
                <img
                  src={formData.thumbnail}
                  alt="Course Thumbnail"
                  className="w-28 h-20 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
              )}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="Image URL or upload file below..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                />
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12356B] text-white font-bold cursor-pointer hover:bg-[#0e2a56] shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingThumbnail ? 'Uploading Thumbnail...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Row 7: Dynamic Syllabus Module Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Interactive Syllabus Modules & Topics
                </label>
                <p className="text-[11px] text-slate-500">Add course modules and detailed topics for the public syllabus accordion.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSyllabusModule}
                className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Module
              </button>
            </div>

            {formData.syllabus.map((mod, modIdx) => (
              <div key={modIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    required
                    value={mod.title}
                    onChange={(e) => {
                      const updated = [...formData.syllabus];
                      updated[modIdx].title = e.target.value;
                      setFormData({ ...formData, syllabus: updated });
                    }}
                    placeholder={`Module / Paper ${modIdx + 1} Title`}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  />
                  {formData.syllabus.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSyllabusModule(modIdx)}
                      className="text-rose-500 hover:text-rose-700 p-1.5"
                      title="Remove Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={mod.description || ''}
                  onChange={(e) => {
                    const updated = [...formData.syllabus];
                    updated[modIdx].description = e.target.value;
                    setFormData({ ...formData, syllabus: updated });
                  }}
                  placeholder="Module summary / description"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                />

                {/* Topics in this Module */}
                <div className="pl-3 border-l-2 border-blue-200 space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Topics Covered</span>
                    <button
                      type="button"
                      onClick={() => handleAddTopic(modIdx)}
                      className="text-[11px] font-bold text-[#1769D2] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Topic
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mod.topics?.map((topic, topicIdx) => (
                      <div key={topicIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => handleTopicChange(modIdx, topicIdx, e.target.value)}
                          placeholder="Topic name"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(modIdx, topicIdx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] text-white font-extrabold py-3.5 px-8 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />{' '}
              {submitting ? 'Saving Course...' : isEditMode ? 'Update Course Program' : 'Publish Course Program'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};
