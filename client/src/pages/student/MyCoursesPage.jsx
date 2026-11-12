import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useRealtimeEvent } from '../../context/SocketContext';
import { BookOpen, PlayCircle, Clock, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export const MyCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/students/dashboard');
      if (res.success && res.data) {
        setCourses(res.data.enrolledCourses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useRealtimeEvent('enrollment:changed', useCallback(() => {
    fetchCourses();
  }, [fetchCourses]));

  useRealtimeEvent('courses:updated', useCallback(() => {
    fetchCourses();
  }, [fetchCourses]));

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            My Enrolled Courses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your active video modules, download PDF study notes, and review class recordings.
          </p>
        </div>
        <Link
          to="/bankers-path"
          className="bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#1769D2] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#1769D2]/20"
        >
          Explore More Courses
        </Link>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading your courses...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(({ entitlementId, course, validUntil }) => (
            <div
              key={entitlementId}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="h-44 bg-slate-100 relative overflow-hidden">
                <img
                  src={course?.thumbnail || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'}
                  alt={course?.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#12356B] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {course?.division === 'BANKERS_PATH'
                      ? "Banker's Path"
                      : course?.division === 'TUITIONS'
                      ? 'Tuitions & Coaching'
                      : course?.division === 'ENTRANCE_EXAMS'
                      ? 'Entrance Exam'
                      : 'Competitive Exam'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#12356B] leading-snug">
                    {course?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Access Valid Until: <strong>{new Date(validUntil).toLocaleDateString()}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Enrolment Active
                  </span>
                  <Link
                    to={`/student/courses/${course?._id}/player`}
                    className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    <PlayCircle className="w-4 h-4 text-[#F4B942]" /> Open Course Player
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#12356B]">No Courses Enrolled Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse our catalogue and purchase or try free demo classes to unlock video content.
          </p>
          <Link
            to="/bankers-path"
            className="inline-block bg-[#12356B] text-white px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            Explore Course Catalogue
          </Link>
        </div>
      )}
      </div>
    </div>
  );
};
