import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
  Award,
  Video,
  FileCheck2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  MapPin,
} from 'lucide-react';

export const CourseDetailsPage = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [userAccess, setUserAccess] = useState({ isEnrolled: false });
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [openModuleIdx, setOpenModuleIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await courseService.getCourseBySlug(slug);
        if (res.success && res.data) {
          setCourse(res.data.course);
          setUserAccess(res.data.userAccess || { isEnrolled: false });

          // Fetch lessons
          const lessonRes = await courseService.getCourseLessons(res.data.course._id);
          if (lessonRes.success && lessonRes.data) {
            setLessons(lessonRes.data.lessons || []);
            // Set first preview lesson as active by default if available
            const firstPreview = lessonRes.data.lessons.find(l => l.isPreview);
            if (firstPreview) setActiveLesson(firstPreview);
          }
        }
      } catch (err) {
        console.error('Course details fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading course curriculum...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#12356B]">Course Not Found</h2>
        <p className="text-sm text-slate-600 mt-2 mb-6">The requested course could not be located or has been archived.</p>
        <Link to="/bankers-path" className="bg-[#12356B] text-white px-6 py-2.5 rounded-xl text-sm font-bold">
          Explore All Courses
        </Link>
      </div>
    );
  }

  const isBankersPath = course.division === 'BANKERS_PATH';
  const isEnrolled = userAccess.isEnrolled;

  return (
    <div className="pb-20 space-y-12">
      {/* Course Header Banner */}
      <section className="bg-gradient-to-br from-[#12356B] via-[#17488B] to-[#1769D2] text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-blue-200">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link
                to={course.division === 'BANKERS_PATH' ? '/bankers-path' : course.division === 'ENTRANCE_EXAMS' ? '/entrance-exams' : '/competitive-exams'}
                className="hover:text-white transition-colors"
              >
                {course.division === 'BANKERS_PATH' ? "Banker's Path" : course.division === 'ENTRANCE_EXAMS' ? 'Entrance Exams' : 'Competitive Exams'}
              </Link>
              <span>/</span>
              <span className="text-[#F4B942] font-bold truncate max-w-[180px] sm:max-w-xs">{course.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#F4B942] text-[#12356B] text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {course.categoryId?.name || (course.division === 'BANKERS_PATH' ? "Banker's Path" : course.division === 'ENTRANCE_EXAMS' ? "Entrance Exams" : "Competitive Exams")}
              </span>
              <span className="bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                {course.mode === 'BOTH' ? 'Online + Offline Batches' : `${course.mode} Mode`}
              </span>
              {course.states && course.states.length > 0 && (
                <span className="bg-emerald-400/20 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-400/30 inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>{course.states.join(', ')}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-blue-100 max-w-3xl leading-relaxed">
              {course.shortDescription}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-blue-200">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F4B942]" />
                <span>Duration: {course.duration || '3 Months'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#F4B942]" />
                <span>Batch: {course.batchSchedule}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Validity: {course.validityDays || 180} Days</span>
              </div>
            </div>
          </div>

          {/* Checkout / Enrolment Summary Card */}
          <div className="lg:col-span-4 bg-white text-[#17243A] p-6 rounded-3xl shadow-2xl border border-slate-100">
            <div className="mb-4">
              <span className="text-xs text-slate-500 font-bold uppercase">Comprehensive Course Fee</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#12356B]">₹{(course.fee ?? course.price ?? 0).toLocaleString('en-IN')}</span>
                {course.originalPrice && course.originalPrice > (course.fee ?? course.price ?? 0) && (
                  <span className="text-sm text-slate-400 line-through">₹{course.originalPrice?.toLocaleString('en-IN')}</span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Includes Live Zoom Classes + Video Library + Model Papers</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              {isEnrolled ? (
                <Link
                  to="/student/my-courses"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Go to Learning Portal
                </Link>
              ) : (
                <Link
                  to={`/checkout?type=COURSE&id=${course._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-[#12356B]/20"
                >
                  Enrol Now <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link
                to={`/enquiry?course=${encodeURIComponent(course.title)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#1769D2] font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-[#1769D2]/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> Book a Free Demo Session
              </Link>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
              <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Single-device secure learning login</p>
              <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 10-20 Full length mock tests included</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Detailed Course Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#12356B] font-heading">
              Course Overview & Structure
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {course.fullDescription}
            </div>

            {/* Learning Objectives */}
            {course.learningObjectives?.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-base font-bold text-[#12356B] font-heading">What You Will Achieve:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {course.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Video Lesson Library & Free Demo Player */}
          <div id="demo" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-[#1769D2] uppercase tracking-wider">Class Curriculum</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#12356B] font-heading mt-0.5">
                  Recorded Lessons & Video Previews
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {lessons.length} Lessons Available
              </span>
            </div>

            {/* Video Player Box */}
            {activeLesson && (
              <div className="space-y-3 bg-slate-900 rounded-2xl overflow-hidden shadow-xl p-3 sm:p-4 text-white">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="text-[#F4B942] font-bold flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4" />
                    Now Playing: {activeLesson.title}
                  </span>
                  {activeLesson.isPreview && (
                    <span className="bg-[#1769D2] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      Free Demo Preview
                    </span>
                  )}
                </div>

                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
                  <video
                    src={activeLesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                    poster={course.thumbnail}
                  />
                </div>
                <p className="text-xs text-slate-300 px-1">{activeLesson.description}</p>
              </div>
            )}

            {/* Lesson List */}
            <div className="space-y-2.5">
              {lessons.map((lesson, idx) => {
                const isUnlocked = isEnrolled || lesson.isPreview;
                return (
                  <div
                    key={lesson._id}
                    onClick={() => isUnlocked && setActiveLesson(lesson)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isUnlocked
                        ? 'bg-slate-50 hover:bg-[#EAF3FF] border-slate-200 cursor-pointer'
                        : 'bg-slate-50/50 border-slate-200/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        lesson.isPreview ? 'bg-[#EAF3FF] text-[#1769D2]' : isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isUnlocked ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-400">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-[#12356B] truncate">{lesson.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{lesson.moduleTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 font-medium">{lesson.durationMinutes}m</span>
                      {lesson.isPreview ? (
                        <span className="bg-[#F4B942] text-[#12356B] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Free Demo
                        </span>
                      ) : !isEnrolled ? (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Locked
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Syllabus Modules Accordion */}
          {course.syllabus?.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#12356B] font-heading">
                Detailed Paper & Subject Syllabus
              </h2>

              <div className="space-y-3">
                {course.syllabus.map((module, idx) => {
                  const isOpen = openModuleIdx === idx;
                  return (
                    <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenModuleIdx(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors font-bold text-sm text-[#12356B]"
                      >
                        <span>{module.title}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-100 space-y-3 text-xs sm:text-sm text-slate-700">
                          {module.description && <p className="text-slate-600 italic">{module.description}</p>}
                          {module.topics?.length > 0 && (
                            <ul className="space-y-1.5 pl-2">
                              {module.topics.map((t, tidx) => (
                                <li key={tidx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2]"></span>
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          {course.faqs?.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#12356B] font-heading">
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {course.faqs.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors font-bold text-sm text-[#12356B]"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#1769D2] shrink-0" />
                          {faq.question}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Widgets (Faculty Profile & Benefits) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Faculty Profile Card */}
          {course.faculty?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-[#12356B] font-heading flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F4B942]" /> Lead Faculty Mentor
              </h3>

              {course.faculty.map((f, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#12356B] text-white flex items-center justify-center font-bold text-base">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#12356B]">{f.name}</h4>
                      <p className="text-xs text-[#1769D2] font-semibold">{f.designation}</p>
                    </div>
                  </div>
                  {f.bio && <p className="text-xs text-slate-600 leading-relaxed">{f.bio}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Quick Enrolment Guarantee */}
          <div className="bg-gradient-to-br from-[#12356B] to-[#1769D2] p-6 rounded-3xl text-white shadow-lg space-y-3">
            <Sparkles className="w-8 h-8 text-[#F4B942]" />
            <h4 className="text-lg font-bold font-heading">Ranvi Career Guarantee</h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              Join 15,000+ successful banking officers and competitive exam qualifiers. Enjoy uninterrupted live Zoom sessions and personalized doubt clearing support.
            </p>
            <Link
              to="/enquiry"
              className="inline-block w-full text-center py-2.5 bg-[#F4B942] text-[#12356B] font-bold text-xs rounded-xl shadow-md mt-2"
            >
              Speak to Counselor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
