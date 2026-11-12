import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { LessonMediaPlayer } from '../../components/courses/LessonMediaPlayer';
import {
  PlayCircle,
  CheckCircle2,
  FileText,
  Download,
  Lock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

export const CoursePlayerPage = () => {
  const { courseId } = useParams();
  const { error: toastError } = useToast();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectLessonForPlayback = useCallback(async (lesson) => {
    if (!lesson || !lesson.isUnlocked) {
      toastError('This lesson requires an active course enrolment.');
      return;
    }
    try {
      const pbRes = await courseService.getLessonPlayback(lesson._id);
      if (pbRes?.success && pbRes.data?.lesson) {
        setActiveLesson({ ...lesson, ...pbRes.data.lesson, isUnlocked: true });
      } else {
        setActiveLesson(lesson);
      }
    } catch (err) {
      toastError(err.message || 'Unable to authorize lesson playback');
    }
  }, [toastError]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await courseService.getCourseLessons(courseId);
        if (res.success && res.data) {
          setCourse(res.data.course);
          const list = res.data.lessons || [];
          setLessons(list);
          const firstUnlocked = list.find((l) => l.isUnlocked || l.isPreview);
          if (firstUnlocked) {
            await selectLessonForPlayback(firstUnlocked);
          } else if (list.length > 0) {
            setActiveLesson(list[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [courseId, selectLessonForPlayback]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading course player...</p>
      </div>
    );
  }

  const currentIdx = lessons.findIndex(l => l._id === activeLesson?._id);

  const handleNext = () => {
    for (let i = currentIdx + 1; i < lessons.length; i += 1) {
      if (lessons[i].isUnlocked) {
        selectLessonForPlayback(lessons[i]);
        return;
      }
    }
  };

  const handlePrev = () => {
    for (let i = currentIdx - 1; i >= 0; i -= 1) {
      if (lessons[i].isUnlocked) {
        selectLessonForPlayback(lessons[i]);
        return;
      }
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Top Breadcrumb */}
      <div className="shrink-0 flex items-center justify-between">
        <Link
          to="/student/my-courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#12356B]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </Link>
        <span className="text-xs font-bold text-[#12356B] bg-[#EAF3FF] px-3 py-1 rounded-full">
          {course?.title}
        </span>
      </div>

      {/* Main Player Grid */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Video Player Box */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl space-y-4">
            <LessonMediaPlayer lesson={activeLesson} autoPlay />

            {/* Video Controls & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div>
                <span className="text-[10px] font-bold text-[#F4B942] uppercase tracking-wider block">
                  {activeLesson?.subject ? `${activeLesson.subject} • ` : ''}
                  {activeLesson?.chapter ? `${activeLesson.chapter} • ` : ''}
                  {activeLesson?.moduleTitle}
                </span>
                <h2 className="text-lg font-bold font-heading text-white">
                  {activeLesson?.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIdx === lessons.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-[#1769D2] hover:bg-blue-600 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeLesson?.description}
            </p>

            {/* Study Material Download Pill */}
            {activeLesson?.studyMaterialName && (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <FileText className="w-4 h-4 text-[#F4B942]" />
                  <span>{activeLesson.studyMaterialName}</span>
                </div>
                <a
                  href={activeLesson.studyMaterialUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-[#12356B] px-3.5 py-1.5 rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Notes
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Modules & Lessons Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#12356B] font-heading">Course Curriculum</h3>
            <span className="text-xs font-bold text-slate-500">{lessons.length} Lessons</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?._id === lesson._id;
              return (
                <div
                  key={lesson._id}
                  onClick={() => lesson.isUnlocked && selectLessonForPlayback(lesson)}
                  className={`p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#12356B] text-white border-[#12356B] shadow-md shadow-[#12356B]/20 cursor-pointer'
                      : lesson.isUnlocked
                      ? 'bg-slate-50 hover:bg-[#EAF3FF] border-slate-200 text-slate-700 cursor-pointer'
                      : 'bg-slate-50/60 border-slate-200/70 text-slate-400 opacity-75 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-[#F4B942]' : lesson.isUnlocked ? 'bg-blue-100 text-[#1769D2]' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {lesson.isUnlocked ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{lesson.title}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        {lesson.subject ? `${lesson.subject} • ` : ''}
                        {lesson.chapter ? `${lesson.chapter} • ` : ''}
                        {lesson.moduleTitle}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    {lesson.durationMinutes}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
