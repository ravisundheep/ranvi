import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../../services';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ArrowRight,
  Users,
} from 'lucide-react';

export const MyProgramsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const res = await enrollmentService.getMyEnrollments();
        if (isMounted && res?.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.enrollments || [];
          setEnrollments(list.filter((e) => e.enrollmentStatus === 'ENROLLED'));
        }
      } catch (err) {
        console.error('Failed to load my programs', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEnrollments();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif">
            My Enrolled Tuition & Coaching Programs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your active tuition batches, subjects, classroom schedules, and study resources.
          </p>
        </div>
        <Link
          to="/student/available-programs"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4 text-[#F4B942]" />
          Browse Programs
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading your programs...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No active tuition programs</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not have any active tuition or coaching enrollments right now.
          </p>
          <Link
            to="/student/available-programs"
            className="inline-block mt-2 px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#1E293B]"
          >
            Explore Available Programs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enr) => {
            const course = enr.courseId || {};
            return (
              <div
                key={enr._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE ENROLLMENT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {enr.enrollmentId}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {course.title || 'Tuition Program'}
                  </h3>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Batch Timing:</span>
                      <span className="font-bold text-slate-800">{enr.batchTiming || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mode:</span>
                      <span className="font-bold text-slate-800">{course.mode || 'ONLINE & OFFLINE'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Enrolled On:</span>
                      <span className="font-bold text-slate-800">
                        {new Date(enr.enrolledAt || enr.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <Link
                    to="/student/live-classes"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 text-[#1769D2] hover:bg-blue-100 font-bold text-xs transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Live Classes</span>
                  </Link>

                  <Link
                    to={`/tuition-programs/${course.slug || ''}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0B2545] text-white hover:bg-[#1E293B] font-bold text-xs transition-colors"
                  >
                    <span>Program Syllabus</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProgramsPage;
