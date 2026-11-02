import React, { useState, useEffect } from 'react';
import { courseService } from '../../services';
import { PageBanner } from '../../components/common/PageBanner';
import { PlayCircle, Lock, BookOpen, Clock, ShieldCheck, ArrowRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecordedClassesPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseService.getCourses({ limit: 20 });
        if (res.success && res.data.courses?.length > 0) {
          setCourses(res.data.courses);
          setSelectedCourse(res.data.courses[0]);
          loadCourseLessons(res.data.courses[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const loadCourseLessons = async (courseId) => {
    try {
      const res = await courseService.getCourseLessons(courseId);
      if (res.success && res.data) {
        setLessons(res.data.lessons || []);
        const firstPreview = res.data.lessons?.find(l => l.isPreview);
        if (firstPreview) setActiveLesson(firstPreview);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    loadCourseLessons(course._id);
  };

  return (
    <div className="space-y-12 pb-20">
      <PageBanner
        title="Recorded Video Library & Concept Lessons"
        subtitle="Learn at your own pace anytime, anywhere. Full HD recorded classes categorized by modules, formulas, case studies, and previous year paper solutions."
        breadcrumbs={[{ label: 'Recorded Classes' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Course Select Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Course:</span>
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Filter courses..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
              />
              {courseSearch && (
                <button
                  type="button"
                  onClick={() => setCourseSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-h-36 overflow-y-auto pt-1">
            {courses
              .filter((c) => !courseSearch.trim() || c.title.toLowerCase().includes(courseSearch.trim().toLowerCase()))
              .map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleSelectCourse(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCourse?._id === c._id
                      ? 'bg-[#12356B] text-white shadow-md'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {c.title}
                </button>
              ))}
          </div>
        </div>

        {/* Video Player & Lesson Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Video Screen */}
          <div className="lg:col-span-8 space-y-4">
            {activeLesson ? (
              <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F4B942] font-bold flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4" />
                    Now Playing: {activeLesson.title}
                  </span>
                  {activeLesson.isPreview && (
                    <span className="bg-[#1769D2] text-white px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      Free Demo
                    </span>
                  )}
                </div>

                <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-inner">
                  <video
                    src={activeLesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold font-heading">{activeLesson.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{activeLesson.description}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#12356B]">Select a Free Preview Lesson to Watch</h3>
                <p className="text-xs text-slate-500 mt-1">Choose any lesson marked as Free Demo from the playlist on the right.</p>
              </div>
            )}
          </div>

          {/* Lesson Playlist */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-[#12356B] font-heading">Course Playlist</h4>
              <span className="text-xs font-bold text-slate-500">{lessons.length} Lessons</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson._id}
                  onClick={() => lesson.isUnlocked && setActiveLesson(lesson)}
                  className={`p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${
                    activeLesson?._id === lesson._id
                      ? 'bg-[#EAF3FF] border-[#1769D2] text-[#12356B] font-bold shadow-xs'
                      : lesson.isUnlocked
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer text-slate-700'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-70 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      lesson.isPreview ? 'bg-[#EAF3FF] text-[#1769D2]' : lesson.isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {lesson.isUnlocked ? <PlayCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{lesson.title}</p>
                      <p className="text-[10px] text-slate-400">{lesson.durationMinutes} mins</p>
                    </div>
                  </div>

                  {lesson.isPreview ? (
                    <span className="bg-[#F4B942] text-[#12356B] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                      Demo
                    </span>
                  ) : !lesson.isUnlocked ? (
                    <span className="bg-slate-200 text-slate-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                      Lock
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {selectedCourse && (
              <div className="pt-4 border-t border-slate-100">
                <Link
                  to={`/checkout?type=COURSE&id=${selectedCourse._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Unlock Full Course (₹{selectedCourse.fee}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
