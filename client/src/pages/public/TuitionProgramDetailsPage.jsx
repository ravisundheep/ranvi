import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tuitionService } from '../../services';
import { PageBanner } from '../../components/common/PageBanner';
import {
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const TuitionProgramDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(0);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await tuitionService.getTuitionProgramBySlug(slug);
        if (res && res.success && res.data) {
          setProgram(res.data);
        } else {
          setError('Coaching program not found or no longer active.');
        }
      } catch (err) {
        console.error('Failed to load program details:', err);
        setError('Unable to load program details. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-16">
        <PageBanner title="Loading Program Details..." breadcrumbs={[{ label: 'Tuitions', link: '/tuition-programs' }, { label: 'Details' }]} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-6">
            <div className="w-1/3 h-8 bg-slate-200 rounded-md" />
            <div className="w-full h-64 bg-slate-200 rounded-2xl" />
            <div className="w-2/3 h-4 bg-slate-200 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-16">
        <PageBanner title="Program Not Found" breadcrumbs={[{ label: 'Tuitions', link: '/tuition-programs' }, { label: 'Not Found' }]} />
        <div className="max-w-xl mx-auto px-4 pt-16 text-center space-y-4">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Program Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'The requested coaching program could not be located.'}</p>
          <div className="pt-2">
            <Link
              to="/tuition-programs"
              className="bg-[#0B2545] hover:bg-[#12356B] text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
            >
              <span>Browse All Tuition Programs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discountPercent =
    program.originalPrice && program.originalPrice > program.fee
      ? Math.round(((program.originalPrice - program.fee) / program.originalPrice) * 100)
      : null;

  const isClosed = program.isEnrollmentOpen === false;
  const isFull = typeof program.availableSeats === 'number' && program.availableSeats <= 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageBanner
        title={program.title}
        subtitle={program.shortDescription}
        breadcrumbs={[
          { label: 'Tuitions & Coaching', link: '/tuition-programs' },
          { label: program.title },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Banner Image Card */}
            <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm relative bg-slate-900">
              <img
                src={program.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop'}
                alt={program.title}
                className="w-full h-64 sm:h-80 object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#0B1E3D]/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {program.mode === 'BOTH' ? 'Online + Offline Batches' : program.mode}
                  </span>
                  {program.subject && (
                    <span className="bg-[#1769D2]/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {program.subject}
                    </span>
                  )}
                  {program.states && program.states.length > 0 && (
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {program.states.join(', ')}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-3xl font-black font-serif text-white tracking-tight leading-tight">
                  {program.title}
                </h1>
              </div>
            </div>

            {/* Program Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-[#0B2545] font-serif flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1769D2]" />
                <span>Program Overview</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {program.fullDescription || program.shortDescription}
              </div>

              {program.eligibilityCriteria && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-[#1769D2] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-[#0B2545] uppercase tracking-wider">
                      Eligibility & Target Audience
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {program.eligibilityCriteria}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Course Objectives / Highlights */}
            {program.learningObjectives && program.learningObjectives.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <h2 className="text-lg sm:text-xl font-black text-[#0B2545] font-serif flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#009E60]" />
                  <span>Key Learning Objectives</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {program.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Syllabus Modules */}
            {program.syllabus && program.syllabus.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-[#0B2545] font-serif flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#7C3AED]" />
                    <span>Curriculum & Syllabus Modules</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {program.syllabus.length} Modules
                  </span>
                </div>

                <div className="space-y-2.5">
                  {program.syllabus.map((mod, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === idx ? -1 : idx)}
                        className="w-full px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1769D2] font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {mod.title}
                          </span>
                        </div>
                        {activeAccordion === idx ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {activeAccordion === idx && (
                        <div className="p-4 bg-white border-t border-slate-100 space-y-2 text-xs text-slate-600">
                          {mod.description && <p className="leading-relaxed">{mod.description}</p>}
                          {mod.topics && mod.topics.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {mod.topics.map((t, tidx) => (
                                <li key={tidx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2]" />
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faculty Mentors */}
            {program.faculty && program.faculty.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <h2 className="text-lg sm:text-xl font-black text-[#0B2545] font-serif flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1769D2]" />
                  <span>Program Faculty Mentors</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {program.faculty.map((f, i) => (
                    <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <img
                        src={f.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                        alt={f.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-[#0B2545] truncate">{f.name}</h4>
                        <p className="text-[11px] text-[#1769D2] font-semibold truncate">{f.designation}</p>
                        {f.experience && <p className="text-[10px] text-slate-500">{f.experience}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar: Enrollment & Pricing Card */}
          <div className="space-y-6">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
              {/* Fee Header */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Program Tuition Fee
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B2545]">
                    ₹{program.fee.toLocaleString('en-IN')}
                  </span>
                  {program.originalPrice && program.originalPrice > program.fee && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{program.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {discountPercent && (
                  <div className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Save {discountPercent}% Special Early Scholarship
                  </div>
                )}
              </div>

              {/* Program Attributes List */}
              <div className="space-y-3 py-3 border-y border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration:
                  </span>
                  <span className="font-bold text-slate-800">{program.duration || '3 Months'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Learning Mode:
                  </span>
                  <span className="font-bold text-slate-800">{program.mode}</span>
                </div>
                {program.batchSchedule && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Batch Timing:
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px] text-right">
                      {program.batchSchedule}
                    </span>
                  </div>
                )}
                {program.startDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date:
                    </span>
                    <span className="font-bold text-slate-800">{formatDate(program.startDate)}</span>
                  </div>
                )}
                {program.registrationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-600 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Deadline:
                    </span>
                    <span className="font-bold text-amber-700">{formatDate(program.registrationDeadline)}</span>
                  </div>
                )}
                {typeof program.availableSeats === 'number' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Available Seats:
                    </span>
                    <span className={`font-black ${program.availableSeats <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {program.availableSeats} of {program.totalSeats || 50}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {isClosed ? (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-center space-y-1">
                  <p className="text-xs font-bold text-red-700">Enrollment Closed</p>
                  <p className="text-[11px] text-red-500">Admissions for this batch are currently closed.</p>
                </div>
              ) : isFull ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-800">Batch Capacity Full</p>
                  <p className="text-[11px] text-amber-600">All available seats for this coaching batch have been reserved.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to={`/tuition-programs/${program.slug}/enroll`}
                    className="w-full bg-[#009E60] hover:bg-[#007044] active:scale-98 text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Apply & Enroll Online</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[10px] text-center text-slate-400 font-medium">
                    Secure 256-bit online payment • Instant enrollment confirmation
                  </p>
                </div>
              )}

              {/* Trust Features */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Government Registered Institution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Single-Device Secure Student Portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Doubt Support & Weekly Test Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuitionProgramDetailsPage;
