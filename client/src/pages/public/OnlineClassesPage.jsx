import React, { useState, useEffect, useMemo } from 'react';
import { PageBanner } from '../../components/common/PageBanner';
import { liveClassService } from '../../services';
import { Video, Calendar, Clock, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OnlineClassesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await liveClassService.getPublicSchedule();
        if (isMounted && res?.success && Array.isArray(res.data)) {
          setBatches(res.data);
        }
      } catch (err) {
        console.error('Failed to load live class schedule:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSchedule();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.trim().toLowerCase();
    return batches.filter(
      (b) =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.courseId?.title || '').toLowerCase().includes(q) ||
        (b.batchName || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        (b.facultyName || '').toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  return (
    <div className="space-y-12 pb-20">
      <PageBanner
        title="Live Interactive Online Classes via Zoom"
        subtitle="Experience high-definition live streaming lectures led by senior ex-bank executives. Ask doubts in real-time, review digital whiteboard notes, and access instant recordings."
        breadcrumbs={[{ label: 'Online Classes' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#1769D2] flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Live Zoom Integration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enrolled students can join secure live Zoom batches with a single click from their personalized student portal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Flexible Daily Timings</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Early morning (6:30 AM) and evening (7:30 PM & 8:30 PM) batches designed specially to suit working banking professionals.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Recorded Backup Available</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Missed a live session due to bank branch work? High-definition recorded backups are automatically added within 2 hours.
            </p>
          </div>
        </div>

        {/* Live Batch Timetable Overview */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-[#1769D2] tracking-wider">Weekly Schedule</span>
              <h2 className="text-2xl font-extrabold text-[#12356B] font-heading mt-1">
                Upcoming Live Class Batches
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batch or faculty..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
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

              <Link
                to="/student/live-classes"
                className="inline-flex items-center gap-2 bg-[#12356B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#0e2a56] transition-colors shadow-xs"
              >
                Access Live Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                  <th className="p-3.5 font-bold">Program</th>
                  <th className="p-3.5 font-bold">Batch Type</th>
                  <th className="p-3.5 font-bold">Timings (IST)</th>
                  <th className="p-3.5 font-bold">Faculty Lead</th>
                  <th className="p-3.5 font-bold">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      Loading live batch timetable...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      {searchQuery
                        ? `No live batches found matching "${searchQuery}".`
                        : 'No upcoming live class sessions are scheduled at the moment.'}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-[#12356B]">
                        <div>{b.courseId?.title || b.title}</div>
                        {b.courseId?.title && b.title !== b.courseId.title && (
                          <div className="text-[11px] font-normal text-slate-500">{b.title}</div>
                        )}
                      </td>
                      <td className="p-3.5">{b.batchName || b.subject || 'Live Batch'}</td>
                      <td className="p-3.5 font-semibold">
                        {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}{' '}
                        {b.startTime ? `• ${b.startTime}` : ''}
                      </td>
                      <td className="p-3.5">{b.facultyName || 'Ranvi Senior Faculty'}</td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2 py-1 rounded ${
                          b.status === 'LIVE'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-[#1769D2]'
                        }`}>
                          {b.status === 'LIVE' ? 'Zoom Live Now' : 'Zoom Live'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineClassesPage;
